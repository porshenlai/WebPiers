(function(Return){
	let Template, Widgets;

	Template = Piers.OBJ.inherit(function(e){
		Widgets.DB[e.WidgetID = Piers.getUID()] = this;
		(this.E = e).value = "";
	},{
		"set": function(d){ this.E.value = d ; return this; },
		"get": function(){ return this.E.value; },
		"clear": function(){ this.E.value = ""; return this; }
	});

	Widgets = {
		"DB":{},
		"query": function(e){
			if (!e.WidgetID)
				e = Piers.DOM(e).find((i)=>i.WidgetID);
			return this.DB[e.WidgetID];
		},
		"Template": Template,

/*
		"UploadBox" : Piers.OBJ.inherit(function (e) {	// {{{
			Widgets.DB[e.WidgetID = Piers.getUID()] = this;
			Object.assign((this.E = e).style,{
				"backgroundRepeat": "no-repeat",
				"backgroundPosition": "50% 50%",
				"backgroundSize": "contain"
			});
		}, {
			"set": async function () {
				let d,im;
				d = await Piers.U.Data.fromUpload("image/*");
				this.E.style.backgroundImage="url("+await d[0].getDataURL()+")";
				return this.E.value = d[0].B;
			},
			"get": function () {
				return this.E.value;
			}
		}),	// }}}
		"OptionBox" : Piers.OBJ.inherit(function (e, value) {	// {{{
			Widgets.DB[e.WidgetID = Piers.getUID()] = this;
			this.E = e;
			this.OptKeys = [];
			for(let i=0,s=this.E.querySelectorAll("[PsOpt]"); i<s.length; i++)
				this.OptKeys.push(s[i].getAttribute("PsOpt").split(":")[0]);	
			this.E.value = (value || this.OptKeys[0]);
			this.__sync__();
		}, {
			"get": function () {
				return this.E.value;
			},
			"set": function (value) {
				Piers.assert(this.OptKeys.indexOf(value) >= 0, "No such key");
				this.E.value = value;
				this.__sync__();
			},
			"rotate": function (shift=1) {
				let i = this.OptKeys.indexOf(this.E.value);
				this.E.value = this.OptKeys[(i+shift) % this.OptKeys.length]
				this.__sync__();
			},
			"__sync__": function () {
				for (let i = 0, s = this.E.querySelectorAll("[PsOpt]"); i < s.length; i++) {
					let k=s[i].getAttribute("PsOpt").split(":")[0];
					if (k!==this.E.value) k+=":hide";
					s[i].setAttribute("PsOpt",k);
				}
			}
		}),	// }}}
*/

		"ComboSelect" : Piers.OBJ.inherit(function (e) {	// {{{
			Template.apply(this, [e]);
			this.E.value = [];
			this.E.addEventListener("change", function (evt) {
				let self=Widgets.query(evt.target), i, s=[];
				self.E.value=[];
				self.E.value = Piers.DOM(self.E).reduce(function(r, e){
					s.push(e);
					r.push(e.value);
					return r;
				}, "select", []);
				self.__sync__(
					0,
					s,
					self.Options||[],
					self.E.value
				);
				evt.preventDefault();
			});
		}, {
			"config": function (options) {
				this.__sync__(
					0,
					this.E.querySelectorAll("select"),
					this.Options = options,
					this.E.value
				);
				return this;
			},
			"set": function (v) {
				this.__sync__(
					0,
					this.E.querySelectorAll("select"),
					this.Options,
					this.E.value = v
				);
				return this;
			},
			"__sync__": function (i,s,d,v) {
				try{
					Piers.assert(s[i] && d,"Data error("+i+")");
					let self = this,
						db={},
						p = (new Piers.DOM(s[i])).clear();

					(Array.isArray(d) ? d : Object.keys(d))
					.reduce(function (p, v) {
						let x=v.split('\r');
						if(x.length<2) x.push(x[0]);
						db[x[0]]=v;
						p.add({"T":"option","A":{"value":x[0]},"C":[x[1]]});
						return p;
					}, p);

					if(v[i])
						s[i].value=v[i];
					v[i]=s[i].value;
					self.__sync__(
						i+1,
						s,
						d[db[s[i].value]],
						v
					);
				}catch(x){ }
			}
		}, Template),	// }}}

		"DMZ" : Piers.OBJ.inherit(function (e, dmzTag) { // {{{
			Template.apply(this, [e]);
			dmzTag = dmzTag || e.getAttribute("WidgetTag") || "DMZ";
			this.Box = Piers.DOM(this.E).reduce(function(r, v){
				r.push([
					v,
					parseInt(v.getAttribute(dmzTag)),
					v.nextSibling,
					v.parentNode
				]);
				return r;
			}, "["+dmzTag+"]", []);
		}, {
			"set": function (mask) {
				this.E.value = (mask = parseInt(mask));
				this.Box.forEach(function(v){
					if (0!=(v[1]&mask)) {
						if (v[0].parentNode) return;
						v[3].insertBefore(v[0], v[2]);
					} else if(v[0].parentNode) v[0].parentNode.removeChild(v[0]);
				});
				return this;
			}
		}, Template), // }}}

		// [{"A":123,"Z":789},...] => <tbody><tr>....</tr></tbody>
		"List": Piers.OBJ.inherit(function (e, fvar) { // {{{
			Template.apply(this, [e]);
			this.FVar = fvar || e.getAttribute("WidgetTag") || "FVar";
			this.Temp=[];
			while(this.E.firstChild){
				if (1===this.E.firstChild.nodeType) this.Temp.push(this.E.firstChild);
				this.E.removeChild(this.E.firstChild);
			}
		}, {
			"set": function (ds=[]) { // {{{
				var self=this;
				self.clear();
				(this.E.value=ds).forEach(function(d, ix){
					if(!d) return;
					self.Temp.forEach(function(temp){
						let fm=new Widgets.Form(temp.cloneNode(true),self.FVar);
						fm.set(d);
						fm.E.__Idx__=ix;
						fm.E.setAttribute("RowType",ix%2==0?"Even":"Odd");
						self.E.appendChild(fm.E);
					});
				});
				return this;
			}, // }}}
			"get": function () { // {{{
				var self=this, rd=[];
				for (let e=self.E.firstChild; e; e=e.nextSibling) {
					if (1!==e.nodeType) continue;
					if (!e.WidgetID) continue;
					let d = Widgets.query(e).get();
					if (e.__Idx__ in rd)
						rd[e.__Idx__]=Object.assign(rd[e.__Idx__],d);
					else
						rd.push(d);
				}
				return (this.E.value=rd);
			}, // }}}
			"clear": function () { // {{{
				while( this.E.firstChild )
					this.E.removeChild(this.E.firstChild);
				return this;
			}, // }}}
			"sort": function (func) {
				return this.set(this.get().sort(func))
			},
			"getData":function (e, idxOnly=false) { // {{{
				let i=Piers.DOM(e).find( function(i){ return "__Idx__" in i; } );
				if (idxOnly) return (i||{}).__Idx__;
				return i.Widget.get();
			}, // }}}
			"removeItem": function (e) { // {{{
				let doc=this.get(),
					i=this.getData(e,true);
				if( undefined !== i )
					doc.splice(i,1);
				return this.set(doc);
			}, // }}}
			"insertItem": function (d, loc=undefined) {	// {{{
				let doc=this.get();
				if( undefined !== loc ) doc.splice(loc, 0, d); else doc.push(d);
				return this.set(doc);
			}	// }}}
		}, Template),	// }}}

		// {"FormA":{...},"FormB":{...}} => <div>FormA</div> or <div>FormB</div>
		"Form": Piers.OBJ.inherit(function (e, fvar) {	// {{{
			Template.apply(this, [e||document.body]);
			this.FVar = fvar || e.getAttribute("WidgetTag") || "FVar";
		}, {
			"set": function (d={}) {
				let self=this;
				Piers.DOM(self.E).dfs(function(r,e){
					let w = e.WidgetID ? Widgets.DB[e.WidgetID] : undefined;
					(e.getAttribute(self.FVar) || "")
						.split(";").filter((i)=>!!i)
						.forEach(function (a) {
							let dd = Piers.OBJ.get(d, (a=a.split(":")).shift(), undefined);
							dd === undefined ? (function(e, t, n){ // clear
								switch(t){
								case "Text": case "text":
									e.textContent="";
									break;
								case "Attribute": case "attribute":
									e.removeAttribute(n);
									break;
								case "Value": case "value":
									delete e[n];
									break;
								case "Style": case "style":
									delete e.style[n];
									break;
								default:
									if (w) return w.clear();
									throw("No such auto-fill type("+t+")");
								}
							})(e, a[0], a[1]) : (function(e, d, t, n) { // set
								switch(t){
								case "Text": case "text":
									e.textContent=d;
									break;
								case "Attribute": case "attribute":
									e.setAttribute(n||"value", d) ;
									break;
								case "Value": case "value":
									e[n||"value"]=d;
									break;
								case "Style": case "style":
									e.style[n||"display"]=d;
									break;
								default:
									if ((!w) && (t in Widgets)) w=new Widgets[t](e, n);
									if (w) return w.set(d);
									throw("No such auto-fill type("+t+")");
								}
							})(e, dd, a[0], a[1]);
						});
					if(w && !w.NoShadow) return true;
				}, undefined, {});
				return this;
			},
			"get": function (d) {
				let self = this;
				Piers.DOM(self.E).dfs(function(d, e){
					let w = e.WidgetID ? Widgets.DB[e.WidgetID] : undefined;
					(e.getAttribute(self.FVar)||"")
						.split(";").filter((i)=>!!i)
						.forEach(function (a) {
							a=a.split(":");
							Piers.OBJ.put(
								d,
								a.shift(),
								(function(e, t, n){
									switch (t) {
									case "Text": return e.textContent;
									case "Value": return e[n||"value"];
									case "Attribute": return e.getAttribute(n||"NoAttr");
									case "Style": return e.style[n||"display"];
									default:
										if (!w)
											throw("No such auto-fill type("+t+")");
										if (e.WidgetID !== self.E.WidgetID)
											return w.get();
									}
								})(e, a[0], a[1])
							);
						});
					if(w && !w.NoShadow) return true;
				}, undefined, self.E.value=d || self.E.value || {});
				return self.E.value;
			},
			"clear": function (l) {
				let self=this;
				Piers.DOM(self.E).dfs(function(r, e){
					let w = e.WidgetID ? Widgets.DB[e.WidgetID] : undefined;

					(e.getAttribute(self.FVar) || "")
						.split(";").filter((i)=>!!i)
						.forEach(function (a) {
							(function(e, t, n){
								switch(t){
								case "Text": case "text":
									e.textContent="";
									break;
								case "Attribute": case "attribute":
									e.removeAttribute(n);
									break;
								case "Value": case "value":
									delete e[n];
									break;
								case "Style": case "style":
									delete e.style[n];
									break;
								default:
									if (w) return w.clear();
									throw("No such auto-fill type("+t+")");
								}
							})(e, a[0], a[1]);
						});
				},undefined,{});
			}
		}, Template),	// }}}

/*
		"WOpt": Piers.OBJ.inherit(function (e, tagname="an") {
			(this.E=e).Widget=this;
			this.Tag=tagname;
		}, {
			"set": function (d) {	// {{{
				let self=this,wa=[];
				return new Promise(function(or,oe){
					Piers.DOM(self.E).forEach(function(e){
						let key=e.getAttribute("WOpt");
						if (key in d) {
							e.removeAttribute("WidgetHide");
							if(!e.Widget) new Widgets.Form(e, self.Tag);
							wa.push(e.Widget.set(d[key]));
						} else if(key)
							e.setAttribute("WidgetHide","1");
					},"[WOpt]");
					self.__Doc__ = d;
					Promise.all(wa).then(or,oe);
				});
			},	// }}}
			"get": function (d) {	// {{{
				let self=this, rv={};
				Piers.DOM(self.E).forEach(function(e){
					if(e.getAttribute("WidgetHide")) return;
					if(e.Widget) rv[e.getAttribute("WOpt")]=e.Widget.get();
				},"[WOpt]");
				return rv;
			},	// }}}
			"clear": function() {	// {{{
				(new Form( this.E, this.Tag )).clear();
				delete this.__Doc__;
			}	// }}}
		}),
*/
		"init":function(tagname="an"){
			Piers.DOM(document.body).forEach(function(pb){
				if(pb.Widget) return;
				var a = pb.getAttribute(tagname);
				if (a && a in Widgets)
					new Widgets[a](pb, tagname);
			}, "["+tagname+"]");
		}
	};

	Return.setResult( Widgets );
})(Piers.__LIBS__.Widget);
