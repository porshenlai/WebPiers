(function(Return){

Promise.all([
	Piers.require("Tab")
]).then(function(libs){
	let Tab = libs[0];

	function SM( div, init ){
		var self=this;
		this.D = { St:undefined };
		this.Tabs = Piers.OBJ.reduce( div.querySelectorAll('[PsTab]'), function( r, v ){
			if( v.getAttribute ) r[ v.getAttribute("PsTab") ] = new Tab( v, r );
			return r;
		}, {} );
		div.__Step__ = this;

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
			var self=this, tab, args;

			if( !(self.__NxS__ && self.__NxS__ in self.Tabs) ) return;
			if( self.D.St && self.D.St in self.Tabs ) // flush latest state
				await self.Tabs[self.D.St].sendEvent( "tab-flush", {"NxS":self.__NxS__,"cancel":function(){
					self.__NxS__ = undefined;
				}} ).complete();
			if(!self.__NxS__) return;

			// prepare new state
			self.D.St = self.__NxS__;
			tab = self.Tabs[self.D.St];
			await Piers.createPromise( tab.prepare() );
			self.__NxS__ = undefined;

			// init new state
			args = tab.E.parentNode.parentNode.__DialogCB__;
			args = args ? {"__DialogCB__":args} : {};
			Object.assign( args, self.__NxA__||{} )
			await tab.sendEvent( "tab-init", args ).complete();
			tab.show();
		}
	});
	SM.findInstance = function( e ){
		return ( Piers.DOM.select(
			e || document.currentScript,
			function(i){ return "__Step__" in i; },
			mode=8 ) || {} ).__Step__;
	};
	Return.setResult(SM);
},Piers.xf);

})(Piers.__LIBS__.Step);
