(function(Return){

	function generic_clear(e, tp) {	// {{{
		let t;
		switch(tp[0]){
		case "T": 
		case "Text": case "text":
			e.textContent="";
			break;
		case "class": case "src": case "activeMode":
		case "Attribute": case "attribute":
			e.removeAttribute({
				"class":"class",
				"src":"src",
				"activeMode":"activeMode",
				"Attribute":"class",
				"attribute":"class"
			}[tp[0]]) ;
			break;
		case "V": case "Val":
		case "Value": case "value":
			t=tp[1]||"value";
			if ("function"===typeof(e[t]))
				e[t](null);
			else
				delete e[t];
			break;
		case "BG":
			delete e.style.backgroundImage;
			break;
		case "Style": case "style":
			delete e.style[tp[1]||"display"];
			break;
		}
	}	// }}}

	function generic_set(e, d, tp) {	// {{{
		switch(tp[0]){
		case "T": 
		case "Text": case "text":
			e.textContent=d;
			break;
		case "class": case "src": case "activeMode":
		case "Attribute": case "attribute":
			e.setAttribute({
				"class":"class",
				"src":"src",
				"activeMode":"activeMode",
				"Attribute":"class",
				"attribute":"class"
			}[tp[0]], d) ;
			break;
		case "V": case "Val":
		case "Value": case "value":
			if (e.updateValue)
				e.updateValue(d);
			else
				e[tp[1]||"value"]=d;
			break;
		case "BG":
			e.style.backgroundImage="url("+d+")";
			break;
		case "Style": case "style":
			e.style[tp[1]||"display"]=d;
			break;
		}
	}	// }}}

	function generic_get(e, tp) {	// {{{
		let t;
		switch(tp[0]){
		case "T": case "Text":
			return e.textContent;
		case "Attribute":
			return e.getAttribute({
				"class":"class",
				"src":"src",
				"activeMode":"activeMode",
				"Attribute":"class",
				"attribute":"class"
			}[tp[0]]) ;
		case "V": case "Val": case "Value":
			t=tp[1]||"value"
			if ("function"===typeof(e[t]))
				return e[t]();
			return e[t];
		case "BG":
			t=/^url(.*)$/.exec(e.style.backgroundImage);
			return t ? t[1] : e.style.backgroundImage;
		case "Style": case "style":
			return e.style[tp[1]||"display"];
		}
	}	// }}}

	let Widgets={
		// [{"A":123,"Z":789},...] => <tbody><tr>....</tr></tbody>
		"List": Piers.OBJ.inherit(function (e, tagname="an") {
			e.Widget=this;
			this.E=e;
			this.Tag=tagname;
			this.LT=this.E.cloneNode(true);
		}, {
			"set": function (ds) { // {{{
				var self=this;
				self.__Doc__ = ds = ds || self.__Doc__ || [];
				self.clear();
				return new Promise(function(or,oe){
					Promise.all(ds.reduce(function(r, d, ix){
						if(!d) return r;
						let fm=new Widgets.Form(self.LT.cloneNode(true),self.Tag);
						r.push(fm.set(d));
						fm.E.__Idx__=ix;
						fm.E.setAttribute("RowType",ix%2==0?"Even":"Odd");
						self.E.appendChild(fm.E);
						return r;
					},[])).then(or, oe);
				});
			}, // }}}
			"get": function () { // {{{
				var self=this,rd=[];
				for (let e=self.E.firstChild;e;e=e.nextSibling) {
					if (1!==e.nodeType) continue;
					rd.push(e.Widget.get());
				}
				return rd;
			}, // }}}
			"clear": function () { // {{{
				while( this.E.firstChild )
					this.E.removeChild(this.E.firstChild);
				delete this.__Doc__;
			}, // }}}
			"act": function (op,args) { // {{{
				switch(op){
				case "SortA":
					return this.set(this.E.__Doc__.sort(function(a,b){
						return a[args] > b[args] ? 1 : a[args] < b[args] ? -1 : 0 ; }));
				case "SortD":
					return this.set(this.E.__Doc__.sort(function(a,b){
						return a[args] > b[args] ? -1 : a[args] < b[args] ? 1 : 0 ; }));
				case "Filter":
					this.E.__Doc__.myFilter = args ? function(d){
						return d && args.reduce(function(r,a,i){
							return r && a.reduce(function(r,o,i){
								return r || (function(o,d){
									var k;
									if( o[1] ) return (d[o[1]]||"").toString().indexOf(o[0]) >= 0;
									for( k in d ) if( (d[k]||"").toString().indexOf(o[0]) >=0 ) return true;
									return false;
								})(o,d);
							},false);
						},true) ? d : undefined;
					} : undefined;
					return this.set();
				}
			}, // }}}
			"removeItem": function (e) { // {{{
				i = Piers.DOM.select( e, function(i){ return "__Idx__" in i; }, mode=8 );
				i = (i||{}).__Idx__;
				if( undefined !== i ){
					this.get();
					this.E.__Doc__.splice(i,1);
					this.set().then(console.log,console.log);
				}
			}, // }}}
			"insertItem": function (d, loc=undefined) {	// {{{
				console.log( "XXXXX", this.get() );
				if( undefined !== loc ) this.E.__Doc__.splice(loc,0,d); else this.E.__Doc__.push(d);
				this.set().then(console.log,console.log);
			}	// }}}
		}),
		// {"FormA":{...},"FormB":{...}} => <div>FormA</div> or <div>FormB</div>
		"OptForm": Piers.OBJ.inherit(function (e, tagname="an") {
			e.Widget=this;
			this.E=e;
			this.FormTag=tagname;
			this.L={};
		}, {
			"set": function (d) {	// {{{
				let wa=[];
				Piers.DOM.selectAll("[OptForm]").forEach(function(e){
					let key=e.getAttribute("OptForm");
					if (key in d) {
						d.removeAttribute("WidgetHide");
						if(!d.Widget) new Widgets.Form(d, tagname);
						wa.push(d.Widget.set(d[key]));
					} else
						d.setAttribute("WidgetHide","1");
				});
				this.E.__Doc__ = d;
				return Promise.all(wa);
			},	// }}}
			"get": function (d) {	// {{{
				var i,es=this.E.querySelectorAll("[OptForm]"), dn, rd={};
				if(!d) d=this.E.__Doc__||{};
				for(i=0;i<es.length;i++){
					dn = es[i].getAttribute("OptForm");
					cs = es[i].getAttribute("class");
					if( (!cs) || cs.indexOf("PsHide") < 0 ){
						if( !(dn in this.L) ) this.L[dn] = new Form( es[i], this.FormTag );
						rd[dn] = this.L[dn].get( d[dn] );
					}
				}
				this.E.__Doc__ = rd;
				return rd;
			},	// }}}
			"clear": function() {	// {{{
				(new Form( this.E, this.FormTag )).clear();
				delete this.E.__Doc__;
			}	// }}}
		}),
		"Form": Piers.OBJ.inherit(function (e=document.body, tagname="an") {
			(this.E=e).Widget=this;
			this.Tag=tagname;
		}, {
			"set": function (d={}) {	// {{{
				let self=this;
				return new Promise(function(or, oe){
					(function scan(p) {
						for (let e=p.firstChild;e;e=e.nextSibling) {
							if (1!==e.nodeType) continue;
							let an=e.getAttribute(self.Tag);
							if (an)
								an.split(";").forEach(function(an) {
									let dp=(an=an.split(":")).shift(), dd=Piers.OBJ.get(d,dp,undefined);
									if (an[0] in Widgets) {
										if (!e.Widget) new Widgets[an[0]](e,self.Tag);
										if (dd===undefined)
											e.Widget.clear();
										else
											e.Widget.set(dd);
									} else {
										if (dd===undefined)
											generic_clear(e,an);
										else
											generic_set(e,dd,an);
										scan(e);
									}
								});
							else scan(e);
						}
						or(self.__Doc__ = d);
					})(self.E);
				});
			},	// }}}
			"get": function (d) {	// {{{
				let self=this, rd=d||self.__Doc__;
				(function scan(p) {
					for (let e=p.firstChild;e;e=e.nextSibling) {
						if (1!==e.nodeType) continue;
						let an=e.getAttribute(self.Tag);
						if (an)
							an.split(";").forEach(function(an) {
								let dp=(an=an.split(":")).shift();
								if (an[0] in Widgets)
									Piers.OBJ.put(rd,dp,e.Widget.get(Piers.OBJ.get(rd,dp,undefined)));
								else
									Piers.OBJ.put(rd,dp,generic_get(e,an));
							});
						else scan(e);
					}
				})(self.E);
				return (self.__Doc__=rd);
			},	// }}}
			"clear": function (l) {	//	{{{
				let self=this;
				(function scan(p) {
					for (let e=p.firstChild;e;e=e.nextSibling) {
						if (1!==e.nodeType) continue;
						let an=e.getAttribute(self.Tag);
						if (an)
							an.split(";").forEach(function(an) {
								let dp=(an=an.split(":")).shift();
								if (an[0] in Widgets)
									e.Widget.clear();
								else
									generic_clear(e,an);
							});
						else scan(e);
					}
				})(self.E);
			},	// }}}

			"readonly": function () {	// {{{
				var i,es;
				es = this.E.querySelectorAll("input");
				for(i=0;i<es.length;i++) es[i].setAttribute("readonly",true);
				es = this.E.querySelectorAll("select");
				for(i=0;i<es.length;i++) es[i].setAttribute("disabled",true);
				es = this.E.querySelectorAll("button");
				for(i=0;i<es.length;i++) es[i].style.display = "none";
			},	// }}}
		}),
		"init":function(tagname="an"){
			Piers.DOM.selectAll(document.body, "["+tagname+"]").forEach(function(pb){
				if(pb.Widget) return;
				var a = pb.getAttribute(tagname);
				if (a && a in Widgets)
					new Widgets[a](pb, tagname);
			});
		}
	};

	Return.setResult( Widgets );
})(Piers.__LIBS__.Widget);
