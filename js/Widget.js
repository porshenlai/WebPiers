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
		"DB":{},
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
			"set": function (value) {
				Piers.assert(this.OptKeys.indexOf(value) >= 0, "No such key");
				this.E.value = value;
				this.__sync__();
			},
			"get": function () {
				return this.E.value;
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
		"ComboSelect" : Piers.OBJ.inherit(function (e, options = []) {	// {{{
			Widgets.DB[e.WidgetID = Piers.getUID()] = this;
			(this.E = e).value = [];
			this.config(options);
			this.E.addEventListener("change", function (evt) {
				let self=Widgets.DB[e.WidgetID], i, s;
				for (
					i = 0, s = e.querySelectorAll("select"), self.E.value=[];
					i<s.length && s[i] !== evt.target;
					i++
				)	self.E.value.push(s[i].value);
				self.E.value.push(s[i].value);
				console.log("DEBUG",self.E.value);
				self.__sync__(0, s, self.Options, self.E.value);
			});
		}, {
			"set": function (v) {
				this.__sync__(0, this.E.querySelectorAll("select"), this.Options, this.E.value = v);
			},
			"get": function () {
				return this.E.value;
			},
			"config": function (options) {
				this.__sync__(0, this.E.querySelectorAll("select"), this.Options = options, this.E.value);
			},
			"__sync__": function (i,s,d,v) {
				try{
					Piers.assert(s[i] && d,"Data error("+i+")");
					let self = this, p = (new Piers.DOM(s[i])).clear();
					p.add((Array.isArray(d) ? d : Object.keys(d)).reduce(function (r, v) {
						v=v.split('\r');
						if(v.length<2) v.push(v[0]);
						return r + '<option value="' + v[0] + '">' + v[1] + '</option>'
					}, "")).then(function(){;
						if(v[i]) s[i].value=v[i];
						v[i]=s[i].value;
						self.__sync__(i+1, s, d[s[i].value], v);
					}, Piers.nf);
				}catch(x){ }
			}
		}),	// }}}

		// [{"A":123,"Z":789},...] => <tbody><tr>....</tr></tbody>
		"List": Piers.OBJ.inherit(function (e, tagname="an") {
			e.Widget=this;
			this.E=e;
			this.Tag=tagname;
			this.Temp=[];
			while(this.E.firstChild){
				if (1===this.E.firstChild.nodeType) this.Temp.push(this.E.firstChild);
				this.E.removeChild(this.E.firstChild);
			}
		}, {
			"set": function (ds=[]) { // {{{
				var self=this;
				self.clear();
				return new Promise(function(or,oe){
					Promise.all(ds.reduce(function(r, d, ix){
						if(!d) return r;
						self.Temp.forEach(function(temp){
							let fm=new Widgets.Form(temp.cloneNode(true),self.Tag);
							r.push(fm.set(d));
							fm.E.__Idx__=ix;
							fm.E.setAttribute("RowType",ix%2==0?"Even":"Odd");
							self.E.appendChild(fm.E);
						});
						return r;
					},[])).then(or, oe);
				});
			}, // }}}
			"get": function () { // {{{
				var self=this,rd=[];
				for (let e=self.E.firstChild; e; e=e.nextSibling) {
					if (1!==e.nodeType) continue;
					if (e.__Idx__ in rd)
						rd[e.__Idx__]=Object.assign(rd[e.__Idx__],e.Widget.get());
					else
						rd.push(e.Widget.get());
				}
				return rd;
			}, // }}}
			"clear": function () { // {{{
				while( this.E.firstChild )
					this.E.removeChild(this.E.firstChild);
			}, // }}}
			"sort": function (func) {
				return this.set(this.get().sort(func))
			},
			"getData":function (e, idxOnly=false) { // {{{
				let i=Piers.DOM.select( function(i){ return "__Idx__" in i; }, root=e, mode=8 );
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
		}),
		// {"FormA":{...},"FormB":{...}} => <div>FormA</div> or <div>FormB</div>
		"WOpt": Piers.OBJ.inherit(function (e, tagname="an") {
			(this.E=e).Widget=this;
			this.Tag=tagname;
		}, {
			"set": function (d) {	// {{{
				let self=this,wa=[];
				return new Promise(function(or,oe){
					Piers.DOM.selectAll("[WOpt]",self.E).forEach(function(e){
						let key=e.getAttribute("WOpt");
						if (key in d) {
							e.removeAttribute("WidgetHide");
							if(!e.Widget) new Widgets.Form(e, self.Tag);
							wa.push(e.Widget.set(d[key]));
						} else if(key)
							e.setAttribute("WidgetHide","1");
					});
					self.__Doc__ = d;
					Promise.all(wa).then(or,oe);
				});
			},	// }}}
			"get": function (d) {	// {{{
				let self=this, rv={};
				Piers.DOM.selectAll("[WOpt]",self.E).forEach(function(e){
					if(e.getAttribute("WidgetHide")) return;
					if(e.Widget) rv[e.getAttribute("WOpt")]=e.Widget.get();
				});
				return rv;
			},	// }}}
			"clear": function() {	// {{{
				(new Form( this.E, this.Tag )).clear();
				delete this.__Doc__;
			}	// }}}
		}),
		"Form": Piers.OBJ.inherit(function (e=document.body, tagname="an") {
			(this.E=e).Widget=this;
			this.Tag=tagname;
		}, {
			"set": function (d={}) {	// {{{
				let self=this;
				return new Promise(function(or, oe){
					(function scan(e) {
						let an=e.getAttribute(self.Tag),close=false;
						if (an)
							an.split(";").forEach(function(an) {
								let dp=(an=an.split(":")).shift(), dd=Piers.OBJ.get(d,dp,undefined);
								if (an[0] in Widgets) {
									if (!e.Widget) new Widgets[an[0]](e,self.Tag);
									if (dd===undefined)
										e.Widget.clear();
									else
										e.Widget.set(dd);
									close=true;
								} else {
									if (dd===undefined)
										generic_clear(e,an);
									else
										generic_set(e,dd,an);
								}
							});
						if(!close)
							for (let c=e.firstChild;c;c=c.nextSibling)
								if (1===c.nodeType) scan(c);
					})(self.E);
					or(self.__Doc__ = d);
				});
			},	// }}}
			"get": function (d) {	// {{{
				let self=this, rd=d||self.__Doc__||{};
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
			Piers.DOM.selectAll("["+tagname+"]").forEach(function(pb){
				if(pb.Widget) return;
				var a = pb.getAttribute(tagname);
				if (a && a in Widgets)
					new Widgets[a](pb, tagname);
			});
		}
	};

	Return.setResult( Widgets );
})(Piers.__LIBS__.Widget);
