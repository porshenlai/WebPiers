(function(Return){

	Piers.OBJ.inherit(function (e, c) {
		var self=this;
		self.C=c;
		self.T=e.cloneNode(true);
		self.E=e;
		e.style.display="none";
		e.addEventListener("transitionend",function(){
			if(e.style.top==="-100%") e.style.display="none";
		});
	},{
		"prepare":async function () {
			let self=this,
				e=self.E, dom,
				src=e.getAttribute("src");
			if (!src) return;
			self.src=src;
			try {
				dom=await Piers.U.create( src ).get()
			} catch(x) {
				dom=(new DOMParser()).parseFromString(
					"<!DocType:html><html><body>Not found</body></html>",
					"text/html"
				);
			}
			dom=dom.querySelector("body").cloneNode(true);
			while (dom.firstChild)
				e.appendChild(dom.firstChild);
			if (!e.__SInitialized__) {
				e.__SInitialized__=true;
				Piers.DOM.selectAll(e, "script").forEach(function(e){
					Piers.DOM.evalScript(e);
				} );
			}
		},
		release:function () {
			let self=this,
				e=self.E,
				ne=self.T.cloneNode(true);
			if (self.src) {
				e.parentNode.insertBefore(ne,e);
				e.parentNode.removeChild(e);
				delete self.src;
				self.E=ne;
			}
		},
		hide:function () {
			this.E.style.top = "-100%";
		},
		show:async function (or=Piers.nf,oe=console.log) {
			let self=this,e,u;
			if( self.C.__Lock__ && (new Date())-self.C.__Lock__ < 3000 )
				return setTimeout( function(){ self.show(); }, 500 );
			self.C.__Lock__ = new Date();
			for( e in self.C ) if( self.C[e].hide ) self.C[e].hide();
			try
				await self.prepare();
				or();
			catch(x) oe(x);
			self.E.style.display = "block";
			setTimeout( function(){
				self.E.style.top="0";
				delete self.C.__Lock__;
			}, 10 );
		},
		sendEvent:function (name, args) {
			let self=this, x={};
			args = Object.assign({
				Tab:self
			}, args||{});
			x.Event=Piers.DOM.sendEvent(self.E, name, {"detail":args||{}});
			return x.Event;
		}
	});

	function SM( div, init ){
		var self=this;
		this.D = { St:undefined };
		this.Tabs = Piers.OBJ.reduce( div.querySelectorAll('[PsTab]'), function( r, v ){
			if( v.getAttribute ) r[ v.getAttribute("PsTab") ] = new Tab( v, r );
			return r;
		}, {} );
		div.__StateMachine__ = this;

		async function uievt( type, evt ){
			var tab = self.Tabs[self.D.St], args;
			args = tab.E.parentNode.parentNode.__DialogCB__;
			args = args ? {"__DialogCB__":args} : {};
			await tab.sendEvent( "trigger", Object.assign( args, {
				"Type":type, "Event":evt,
				"getA":function( an, dv, lv=false ){
					// ,X:tab.E
					var r = Piers.DOM.select( evt.target, "["+an+"]", mode=8 );
					r = [ r, r ? r.getAttribute(an) : dv ];
					return lv ? r : r[1];
				},
				"getV":function( vn, dv, lv=false ){
					// ,X:tab.E
					var r = Piers.DOM.select( evt.target, function(i){ return vn in i; }, mode=8 );
					r = [ r, r ? r[vn] : dv ];
					return lv ? r : r[1];
				}
			} ) ).complete();
		}
		div.addEventListener( "click", async function(evt){ uievt( "click", evt ); } );
		div.addEventListener( "change", async function(evt){ uievt( "change", evt ); } );
		if( init ) init.call(this);
	}

	Object.assign( SM.prototype, {
		"goto":function(st, args){
			if( st in this.Tabs ){
				this.__NxS__ = st;
				this.__NxA__ = args;
				this.__sync__();
			}else console.log("No such state:"+st);
		},
		"cancel":function(nt){ if(nt) this.__NxS__ = nt; else delete this.__NxS__; },
		"isNext":function(sn){ return this.__NxS__ === sn; },
		"getTab":function(){ return this.Tabs[this.D.St]; },
		"getForm":function(){ return this.getTab().Form; },
		"save":function(){
			return JSON.stringify(this.D);
		},
		"load":function(json){
			this.D = JSON.parse(json)
			this.__sync__();
		},
		"editPage":function( ){
			var self = this, url, hnd;
			try {
				url = Piers.U.abs(self.Tabs[self.D.St].src);
				url = /[a-z]*:\/\/[^\/]+\/(.*)/.exec(url)[1]
				hnd = window.open( Piers.Env.PierPath+"editor.html?path=docs:"+url+(document.baseURI ? ("&base="+document.baseURI) : "") );
				hnd.addEventListener("load",function(evt){
					(new Piers.M("dataset",self.D)).to(hnd).send();
				});
			}catch(x){ console.log("Exception:",x); }
		},
		"__sync__":async function(){
			let self=this, tab, args;

			if( !(self.__NxS__ && self.__NxS__ in self.Tabs) ) return;
			if( self.D.St && self.D.St in self.Tabs ){ // flush latest state
				tab=self.Tabs[self.D.St];
				await tab.sendEvent("tab-flush", {
					"NxS":self.__NxS__,
					"cancel":function(){
						self.__NxS__ = undefined;
					}
				}).complete();
				tab.release();
			}
			if(!self.__NxS__) return;

			// prepare new state
			self.D.St = self.__NxS__;
			tab = self.Tabs[self.D.St];
			await Piers.createPromise( tab.prepare() );
			self.__NxS__ = undefined;

			// init new state
			try {
				args=tab.E.parentNode.parentNode.__DialogCB__;
			} catch(x) { args=undefined; }
			args = args ? {"__DialogCB__":args} : {};
			Object.assign( args, self.__NxA__||{} )
			await tab.sendEvent( "tab-init", args ).complete();
			tab.show();
		}
	});
	SM.findInstance = function( e ){
		return ( Piers.DOM.select(
			e || document.currentScript,
			function(i){ return "__StateMachine__" in i; },
			mode=8 ) || {} ).__StateMachine__;
	};

	SM.Dialog=Piers.OBJ.inherit(
		function(tab, init) {
			var C=(this.E=tab).parentNode;
			SM.call(this,tab,init);
			C.style.top = "-100%";
		}, {
			show: function (did, args={}) {
				var self = this, C = self.E.parentNode;
				return new Promise( function(or,oe){
					if( C.style.top === "0%" ) return or();
					(function(e,s){
						var i; for(i=0;i<s.length;i++) s[i].style.display = s[i] == e ? "block" : "none";
					})( self.E, C.querySelectorAll("[PsDialog]") );
					C.style.top = "0%";
					if(did){
						args["__DialogCB__"] = C.__DialogCB__ = function(result,err){
							if( result ) or(result); else console.log(err);
							C.style.top = "-100%";
							C.__DialogCB__ = undefined;
						};
						self.goto( did, args );
					}
				} );
			},
			hide: function (){
				var C = this.E.parentNode;
				if( C.__DialogCB__ ) C.__DialogCB__( undefined, "Cancelled" );
				else C.style.top = "-100%";
			}
		}, SM
	);
	Return.setResult(SM);
})(Piers.__LIBS__.StateMachine);
