class View {
    constructor(options) {
        this.$Dep = {};
        this.$el = document.querySelector(options.el);
        this.$methods = options.methods;
        this._observer(options.data);
        this._compile(this.$el);
    }

    _observer(data) {
        let _self = this;
        const proxyHandler = {
            get(target, key) {
                const prop = target[key];
                if (typeof prop === 'undefined') return;
                if (!prop.isBindingProxy && typeof prop === 'object') {
                    target[key] = new Proxy(prop, proxyHandler);
                }
                return target[key];
            },
            set(target, prop, value) {
                console.log(`Set:${value}`);
                Reflect.set(target, prop, value);
                _self.$Dep[prop].forEach(watcher => watcher.notify());
                return true;
            }
        }

        if (Object.keys(data).length > 0) {
            this.$data = new Proxy(data, proxyHandler)
        }
    }

    _compile(node) {
        let _self = this;
        let data = this.$data;
        if (node) {
            let children = node.children;
            Array.from(children).forEach(function (node) {
                if (node.children.length > 0) {
                    _self._compile(node)
                } else {
                    if (node.hasAttribute('v-bind')) {
                        let model = node.getAttribute('v-bind');
                        (_self.$Dep[model] && Array.isArray(_self.$Dep[model])) ? null : (_self.$Dep[model] = []);
                        _self.$Dep[model].push(new Watcher({
                            node: node,
                            type: 'innerHTML',
                            data: data,
                            key: model
                        }))
                    }

                    if (node.hasAttribute('v-value')) {
                        let model = node.getAttribute('v-value');
                        (_self.$Dep[model] && Array.isArray(_self.$Dep[model])) ? null : (_self.$Dep[model] = []);
                        _self.$Dep[model].push(new Watcher({
                            node: node,
                            type: 'value',
                            data: data,
                            key: model
                        }));
                        node.addEventListener('input', () => { data[model] = node.value })
                    }

                    if (node.hasAttribute('v-click')) {
                        let fn = node.getAttribute('v-click');
                        node.addEventListener('click', () => {
                            if (_self.$methods[fn]) {
                                _self.$methods[fn].apply(data, null);
                            }
                        })
                    }
                }
            })
        }
    }
};

class Watcher {
    constructor(options) {
        this.node = options.node;
        this.type = options.type;
        this.data = options.data;
        this.key = options.key;
    }
    notify() {
        this.node[this.type] = this.data[this.key]
    }
}

window.onload = function () {
    window.View = new View({
        el: '#view',
        data: {
            value: 0
        },
        methods: {
            addOne: function () {
                this.value++;
            },
            minusOne: function () {
                this.value--;
            }
        }
    })
};