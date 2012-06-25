var Partial = function(cid, view, options) {
  this.cid = cid;
  this.view = view;
  this.fn = options.fn;
  this.inverse = options.inverse;
  this.options = options.hash;
  this._ensureElement();
};

_.extend(Partial.prototype, Backbone.Events, {
  _ensureElement: function() {
    var htmlAttributes = View.htmlAttributesFromOptions(this.options);
    delete htmlAttributes.tag;
    delete htmlAttributes.tagName;
    htmlAttributes[partialCidAttributeName] = this.cid;
    this.el = Backbone.View.prototype.make.call(this, this.options.tagName || this.options.tag || 'div', htmlAttributes);
    this.$el = $(this.el);
  },
  html: function(html) {
    if (typeof html === 'undefined') {
      return this.el.innerHTML;
    } else {
      //html may be a SafeString, so call toString()
      var element = this.$el.html(html.toString());
      appendPartials.call(this.view, this.el);
      appendViews.call(this.view, this.el, true);
      return element;
    }
  },
  freeze: function() {
    this.trigger('freeze');
  },
  destroy: function() {
    this.freeze();
    this.trigger('destroyed');
  },
  context: function() {
    return this.view._getContext(this.view.model);
  }
});

_.extend(View.prototype, {
  partial: function(options) {
    var cid = _.uniqueId('partial');
    return new Partial(cid, this, options);
  }
});

View.registerPartialHelper = function(name, callback) {
  return View.registerHelper(name, function() {
    var args = _.toArray(arguments),
        options = args.pop(),
        partial = this._view.partial(options);
    args.push(partial);
    this._view._partials[partial.cid] = partial;
    var htmlAttributes = {};
    htmlAttributes[partialPlaceholderAttributeName] = partial.cid;
    callback.apply(this, args);
    return new Handlebars.SafeString(View.tag(htmlAttributes, ''));
  });
};

//called from View.prototype.html()
function appendPartials(scope) {
  _.toArray($(scope || this.el).find('[' + partialPlaceholderAttributeName + ']')).forEach(function(el) {
    var cid = el.getAttribute(partialPlaceholderAttributeName),
        partial = this._partials[cid];
    if (partial) {
      el.parentNode.insertBefore(partial.el, el);
      el.parentNode.removeChild(el);
    }
  }, this);
}

function destroyPartials() {
  _.each(this._partials, function(partial, cid) {
    partial.destroy();
  });
  this._partials = {};
}
