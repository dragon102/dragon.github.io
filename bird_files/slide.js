(function(window) {
    var navigator = window.navigator,
        isAndroid = /Android/i.test(navigator.userAgent),
        msPointerEnabled = navigator.msPointerEnabled,
        TOUCH_EVENTS = {
            start: msPointerEnabled ? 'MSPointerDown' : 'touchstart',
            move: msPointerEnabled ? 'MSPointerMove' : 'touchmove',
            end: msPointerEnabled ? 'MSPointerUp' : 'touchend'
        },
        slice = Array.prototype.slice,
        dummyStyle = document.createElement('div').style,
        vendor = (function() {
            var vendors = 't,webkitT,MozT,msT,OT'.split(','),
                t,
                i = 0,
                l = vendors.length;
            for (; i < l; i++) {
                t = vendors[i] + 'ransform';
                if (t in dummyStyle) {
                    return vendors[i].substr(0, vendors[i].length - 1);
                }
            }
            return false;
        })(),
        isTouch = false,
        cssVendor = vendor ? '-' + vendor.toLowerCase() + '-' : '',
        prefixStyle = function(style) {
            if (vendor === '') return style;
            style = style.charAt(0).toUpperCase() + style.substr(1);
            return vendor + style;
        },
        transform = prefixStyle('transform'),
        transitionDuration = prefixStyle('transitionDuration'),
        transitionEndEvent = (function() {
            if (vendor == 'webkit' || vendor === 'O') {
                return vendor.toLowerCase() + 'TransitionEnd';
            }
            return 'transitionend';
        })(),
        noop = function() {},
        addClass = function(elem, value) {
            var classes, cur, clazz, i;
            classes = (value || '').match(/\S+/g) || [];
            cur = elem.nodeType === 1 && (elem.className ? (' ' + elem.className + ' ').replace(/[\t\r\n]/g, ' ') : ' ');
            if (cur) {
                i = 0;
                while ((clazz = classes[i++])) {
                    if (cur.indexOf(' ' + clazz + ' ') < 0) {
                        cur += clazz + ' ';
                    }
                }
                elem.className = cur.trim();
            }
        },
        removeClass = function(elem, value) {
            var classes, cur, clazz, i;
            classes = (value || '').match(/\S+/g) || [];
            cur = elem.nodeType === 1 && (elem.className ? (' ' + elem.className + ' ').replace(/[\t\r\n]/g, ' ') : ' ');
            if (cur) {
                i = 0;
                while ((clazz = classes[i++])) {
                    while (cur.indexOf(' ' + clazz + ' ') >= 0) {
                        cur = cur.replace(' ' + clazz + ' ', ' ');
                    }
                }
                elem.className = cur.trim();
            }
        },
        listenTransition = function(target, duration, callbackFn) {
            var me = this,
                clear = function() {
                    if (target.transitionTimer) clearTimeout(target.transitionTimer);
                    target.transitionTimer = null;
                    target.removeEventListener(transitionEndEvent, handler, false);
                },
                handler = function() {
                    clear();
                    if (callbackFn) callbackFn.call(me);
                };
            clear();
            target.addEventListener(transitionEndEvent, handler, false);
            target.transitionTimer = setTimeout(handler, duration + 100);
        };
    var Slide = function(config) {
        config = config || {};
        for (var o in config) {
            this[o] = config[o];
        }
        this.el = typeof this.targetSelector === 'string' ? document.querySelector(this.targetSelector) : this.targetSelector;
        if (msPointerEnabled) this.el.style.msTouchAction = 'pan-y';
        this.el.style.overflow = 'hidden';
        this.wrap = this.wrapSelector ? this.el.querySelector(this.wrapSelector) : this.el.children[1];
        
		this.wrap.style.cssText = cssVendor + 'transform:translate3d(' + (-this.getItemWidth() * this.activeIndex) + 'px,0px,0px);' + cssVendor + 'transition:' + cssVendor + 'transform 0ms;';
        
        this.items = slice.call(this.wrap.children, 0);
        var width = this.el.offsetWidth;
		
		
        var active = this.activeIndex;       
   
        this.setWidth(width);

        if (this.prevSelector) {
            this.prevEl = document.querySelector(this.prevSelector);
            this.prevEl.addEventListener('click', this, false);
        }
        if (this.nextSelector) {
            this.nextEl = document.querySelector(this.nextSelector);
            this.nextEl.addEventListener('click', this, false);
        }
        if (this.indicatorSelector) {
            this.indicators = document.querySelectorAll(this.indicatorSelector);
            this.indicators = slice.call(this.indicators, 0);
        }
       
        this.el.addEventListener(TOUCH_EVENTS.start, this, false);
        /*window.addEventListener("resize", resizeFix, false)
         resizeFix function(){
         }*/
       
        var _lastActive = this.activeIndex;
        this.to(this.activeIndex, true);
        this.running = false;
        if (this.autoPlay) {
            this.start();
        };
    };
    Slide.prototype = {
        activeIndex: 0,
        autoPlay: false,
        interval: 4000,
        duration: 100,
        beforeSlide: noop,
        /**
         * 切换完成回调函数
         */
        onSlide: noop,
        // private
        getItemWidth: function() {
            return this.el.offsetWidth;
			
        },
		
        setWidth: function(width) {
            this.wrap.style.width = (width * this.items.length) + 'px';
            this.items.forEach(function(item) {
                item.style.width = width + 'px';
            });
			
        },
		
        // private
        getLastIndex: function() {
            return this.items.length - 1;
        },
        // private
        getContext: function(index) {
            var last = this.getLastIndex(),
                prev,
                next;
            if (typeof index === 'undefined') {
                index = this.activeIndex;
            }
            prev = index - 1;
            next = index + 1;
            if (prev < 0) {
                prev = last;
            }
            if (next > last) {
                next = 0;
            }
            return {
                prev: prev,
                next: next,
                active: index
            };
        },
        /**
         * 开始自动切换
         */
        start: function() {
            if (!this.running) {
                this.running = true;
                this.clear();
                this.run();
            }
        },
        /**
         * 停止自动切换
         */
        stop: function() {
            this.running = false;
            this.clear();
        },
        // private
        clear: function() {
            clearTimeout(this.slideTimer);
            this.slideTimer = null;
        },
        // private
        run: function() {
            var me = this;
            if (!me.slideTimer) {
                me.slideTimer = setInterval(function() {
                    me.to(me.getContext().next);
                }, me.interval);
            }
        },
        /**
         * 切换到上一个
         */
        prev: function() {
            this.to(this.activeIndex - 1);
        },
        /**
         * 切换到下一个
         */
        next: function() {
            this.to(this.activeIndex + 1);
        },
        // private
        onPrevClick: function() {
            this.clear();
            this.prev();
            if (this.autoPlay) this.run();
        },
        // private
        onNextClick: function() {
            this.clear();
            this.next();
            if (this.autoPlay) this.run();
        },

        to: function(toIndex, silent) {
            var active = this.activeIndex,
                last = this.getLastIndex();
            if (toIndex >= 0 && toIndex <= last && toIndex != active && this.beforeSlide(toIndex) !== false) {
                this.slide(toIndex, silent);
            } else {
                this.slide(active, silent);
            }
        },
        slide: function(toIndex, silent) {
            var me = this,
                active = me.activeIndex,
                lastActive = active,
                handler = function() {
                    me.wrap.removeEventListener(transitionEndEvent, handler, false);
                    me.wrap.style[transitionDuration] = '0ms';
                    if (me.indicators && me.indicatorCls) {
                        if (me.indicators[lastActive]) removeClass(me.indicators[lastActive], me.indicatorCls);
                        if (me.indicators[me.activeIndex]) addClass(me.indicators[me.activeIndex], me.indicatorCls);
                    }
                    me.onSlide(me.activeIndex);
                };
            me.activeIndex = toIndex;
            
            if (!silent) listenTransition(me.wrap, me.duration, handler);
            me.wrap.style[transitionDuration] = silent ? '0ms' : me.duration + 'ms';            
			me.wrap.style[transform] = 'translate3d(' + (-me.getItemWidth() * toIndex) + 'px, 0px, 0px)';
            if (silent) handler();
        },
        onTouchStart: function(e) {
            var me = this;
            if (me.prevEl && me.prevEl.contains && me.prevEl.contains(e.target) ||
                me.nextEl && me.nextEl.contains && me.nextEl.contains(e.target)) {
                return;
            }

            clearTimeout(me.androidTouchMoveTimeout);
            me.clear();
            if (isAndroid) {
                me.androidTouchMoveTimeout = setTimeout(function() {
                    me.resetStatus();
                }, 3000);
            }

            me.el.removeEventListener(TOUCH_EVENTS.move, me, false);
            me.el.removeEventListener(TOUCH_EVENTS.end, me, false);
            me.el.addEventListener(TOUCH_EVENTS.move, me, false);
            me.el.addEventListener(TOUCH_EVENTS.end, me, false);
            delete me.horizontal;

            var pageX = msPointerEnabled ? e.pageX : e.touches[0].pageX,
                pageY = msPointerEnabled ? e.pageY : e.touches[0].pageY;

            me.touchCoords = {};
            me.touchCoords.startX = pageX;
            me.touchCoords.startY = pageY;
            me.touchCoords.timeStamp = e.timeStamp;
        },

        // private
        onTouchMove: function(e) {
            var me = this;
            clearTimeout(me.touchMoveTimeout);
            if (msPointerEnabled) {
                me.touchMoveTimeout = setTimeout(function() {
                    me.resetStatus();
                }, 3000);
            }
            if (!me.touchCoords) {
                return;
            }

            me.touchCoords.stopX = msPointerEnabled ? e.pageX : e.touches[0].pageX;
            me.touchCoords.stopY = msPointerEnabled ? e.pageY : e.touches[0].pageY;

            var offsetX = me.touchCoords.startX - me.touchCoords.stopX,
                absX = Math.abs(offsetX),
                absY = Math.abs(me.touchCoords.startY - me.touchCoords.stopY);

            if (typeof me.horizontal !== 'undefined') {
                if (offsetX !== 0) {
                    e.preventDefault();
                }
            } else {
                if (absX > absY) {
                    me.horizontal = true;
                    if (offsetX !== 0) {
                        e.preventDefault();
                    }
                    if (me.iscroll && me.iscroll.enabled) {
                        me.iscroll.disable();
                    }
                    clearTimeout(me.androidTouchMoveTimeout);
                } else {
                    delete me.touchCoords;
                    me.horizontal = false;
                    return;
                }
            }

            var itemWidth = me.getItemWidth(),
                translateX = me.activeIndex * itemWidth,
                active = me.activeIndex,
                last = me.getLastIndex();

            if ((active === 0 && offsetX < 0) || (active == last && offsetX > 0)) {
                translateX += Math.ceil(offsetX / Math.log(Math.abs(offsetX)));
            } else {
                translateX += offsetX;
            }
            if (absX < itemWidth) {            
				me.wrap.style[transform] = 'translate3d(' + -translateX + 'px, 0px, 0px)';               
            }
        },
        // private
        onTouchEnd: function(e) {
            clearTimeout(this.androidTouchMoveTimeout);
            clearTimeout(this.touchMoveTimeout);
            this.el.removeEventListener(TOUCH_EVENTS.move, this, false);
            this.el.removeEventListener(TOUCH_EVENTS.end, this, false);
            if (this.touchCoords) {
                var itemWidth = this.getItemWidth(),
                    absX = Math.abs(this.touchCoords.startX - this.touchCoords.stopX),
                    active = this.activeIndex,
                    transIndex;

                if (!isNaN(absX) && absX !== 0) {
                    if (absX > itemWidth) {
                        absX = itemWidth;
                    }
                    if (absX >= 80 || (e.timeStamp - this.touchCoords.timeStamp < 200)) {
                        if (this.touchCoords.startX > this.touchCoords.stopX) {
                            transIndex = active + 1;
                        } else {
                            transIndex = active - 1;
                        }
                    } else {
                        transIndex = active;
                    }                   
                    this.to(transIndex);
                    delete this.touchCoords;
                }
            }
            this.resetStatus();
        },
        resetStatus: function() {
            if (this.iscroll) this.iscroll.enable();
            if (this.autoPlay) this.run();
        },
        refresh: function() {
            var last = this.getLastIndex();
            this.items = slice.call(this.wrap.children, 0);
            if (this.activeIndex > last) {
                this.to(last, true);
            }
        },
        handleEvent: function(e) {
            switch (e.type) {
                case TOUCH_EVENTS.start:
                    this.onTouchStart(e);
                    break;
                case TOUCH_EVENTS.move:
                    this.onTouchMove(e);
                    break;
                case TOUCH_EVENTS.end:
                    this.onTouchEnd(e);
                    break;
                case 'click':
                    if (e.target == this.prevEl) {
                        this.onPrevClick();
                    } else if (e.target == this.nextEl) {
                        this.onNextClick();
                    }
                    break;
            }
        },
        /**
         * 销毁
         */
        destroy: function() {
            this.destroyed = true;
            this.stop();
            if (this.prevEl) {
                this.prevEl.removeEventListener('click', this, false);
                this.prevEl = null;
            }
            if (this.nextEl) {
                this.nextEl.removeEventListener('click', this, false);
                this.nextEl = null;
            }
            this.indicators = null;
            this.el.removeEventListener(TOUCH_EVENTS.start, this, false);
            this.el.removeEventListener(TOUCH_EVENTS.move, this, false);
            this.el.removeEventListener(TOUCH_EVENTS.end, this, false);
            this.el = this.wrap = this.items = null;
            this.iscroll = null;
        }
    };
    dummyStyle = null;
    window.Slide = Slide;
})(window);

