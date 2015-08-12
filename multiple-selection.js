/**
 * Angular JS multiple-selection module
 * @author Maksym Pomazan
 * @version 0.0.3
 */
(function() {

    function getSelectableElements(element) {
        var out = [];
        var childs = element.children();
        for (var i = 0; i < childs.length; i++) {
            var child = angular.element(childs[i]);
            if (child.scope().isSelectable) {
                out.push(child);
            } else {
                if (child.scope().$id!=element.scope().$id && child.scope().isSelectableZone === true) {

                } else {
                    out = out.concat(getSelectableElements(child));
                }
            }
        }
        return out;
    }

    function offset(element) {
        var documentElem,
            box = {
                top: 0,
                left: 0
            },
            doc = element && element.ownerDocument;
        documentElem = doc.documentElement;

        if (typeof element.getBoundingClientRect !== undefined) {
            box = element.getBoundingClientRect();
        }

        return {
            top: box.top + (window.pageYOffset || documentElem.scrollTop) - (documentElem.clientTop || 0),
            left: box.left + (window.pageXOffset || documentElem.scrollLeft) - (documentElem.clientLeft || 0)
        };
    }
    angular.module('multipleSelection', [])
        .directive('multipleSelectionItem', [function() {
            return {
                scope: true,
                restrict: 'A',
                link: function(scope, element, iAttrs, controller) {

                    scope.isSelectable = true;
                    scope.isSelecting = false;
                    scope.isSelected = false;

                    element.on('mousedown', function(event) {
                        if (element.scope().isSelected) {
                            if (event.ctrlKey) {
                                element.scope().isSelected = false;
                                element.scope().$apply();
                            }
                        } else {
                            if (!event.ctrlKey) {
                                var childs = getSelectableElements(element.parent());
                                for (var i = 0; i < childs.length; i++) {
                                    if (childs[i].scope().isSelectable) {
                                        if (childs[i].scope().isSelecting === true || childs[i].scope().isSelected === true) {
                                            childs[i].scope().isSelecting = false;
                                            childs[i].scope().isSelected = false;
                                            childs[i].scope().$apply();
                                        }
                                    }
                                }
                            }
                            element.scope().isSelected = true;
                            element.scope().$apply();

                        }
                        event.stopPropagation();
                    });
                }
            };
        }])
        .directive('multipleSelectionZone', ['$document', function($document) {
            return {
                scope: true,
                restrict: 'A',
                link: function(scope, element, iAttrs, controller) {

                    scope.isSelectableZone = true;

                    var startX = 0,
                        startY = 0;
                    var helper;

                    /**
                     * Check that 2 boxes hitting
                     * @param  {Object} box1
                     * @param  {Object} box2
                     * @return {Boolean} is hitting
                     */
                    function checkElementHitting(box1, box2) {
                        return (box2.beginX <= box1.beginX && box1.beginX <= box2.endX || box1.beginX <= box2.beginX && box2.beginX <= box1.endX) &&
                            (box2.beginY <= box1.beginY && box1.beginY <= box2.endY || box1.beginY <= box2.beginY && box2.beginY <= box1.endY);
                    }

                    /**
                     * Transform box to object to:
                     *  beginX is always be less then endX
                     *  beginY is always be less then endY
                     * @param  {Number} startX
                     * @param  {Number} startY
                     * @param  {Number} endX
                     * @param  {Number} endY
                     * @return {Object} result Transformed object
                     */
                    function transformBox(startX, startY, endX, endY) {

                        var result = {};

                        if (startX > endX) {
                            result.beginX = endX;
                            result.endX = startX;
                        } else {
                            result.beginX = startX;
                            result.endX = endX;
                        }
                        if (startY > endY) {
                            result.beginY = endY;
                            result.endY = startY;
                        } else {
                            result.beginY = startY;
                            result.endY = endY;
                        }
                        return result;
                    }

                    /**
                     * Method move selection helper
                     * @param  {Element} hepler
                     * @param  {Number} startX
                     * @param  {Number} startY
                     * @param  {Number} endX
                     * @param  {Number} endY
                     */
                    function moveSelectionHelper(hepler, startX, startY, endX, endY) {

                        var box = transformBox(startX, startY, endX, endY);

                        helper.css({
                            "top": box.beginY + "px",
                            "left": box.beginX + "px",
                            "width": (box.endX - box.beginX) + "px",
                            "height": (box.endY - box.beginY) + "px"
                        });
                    }


                    /**
                     * Method on Mouse Move
                     * @param  {Event} @event
                     */
                    function mousemove(event) {
                        // Prevent default dragging of selected content
                        event.preventDefault();
                        // Move helper
                        moveSelectionHelper(helper, startX, startY, event.pageX, event.pageY);
                        // Check items is selecting
                        var childs = getSelectableElements(element);
                        for (var i = 0; i < childs.length; i++) {
                            if (checkElementHitting(transformBox(offset(childs[i][0]).left, offset(childs[i][0]).top, offset(childs[i][0]).left + childs[i].prop('offsetWidth'), offset(childs[i][0]).top + childs[i].prop('offsetHeight')), transformBox(startX, startY, event.pageX, event.pageY))) {
                                if (childs[i].scope().isSelecting === false) {
                                    childs[i].scope().isSelecting = true;
                                    childs[i].scope().$apply();
                                }
                            } else {
                                if (childs[i].scope().isSelecting === true) {
                                    childs[i].scope().isSelecting = false;
                                    childs[i].scope().$apply();
                                }
                            }
                        }
                    }

                    /**
                     * Event on Mouse up
                     * @param  {Event} event
                     */
                    function mouseup(event) {
                        // Prevent default dragging of selected content
                        event.preventDefault();
                        // Remove helper
                        helper.remove();
                        // Change all selecting items to selected
                        var childs = getSelectableElements(element);

                        for (var i = 0; i < childs.length; i++) {
                            if (childs[i].scope().isSelecting === true) {
                                childs[i].scope().isSelecting = false;

                                childs[i].scope().isSelected = event.ctrlKey ? !childs[i].scope().isSelected : true;
                                childs[i].scope().$apply();
                            } else {
                                if (checkElementHitting(transformBox(childs[i].prop('offsetLeft'), childs[i].prop('offsetTop'), childs[i].prop('offsetLeft') + childs[i].prop('offsetWidth'), childs[i].prop('offsetTop') + childs[i].prop('offsetHeight')), transformBox(event.pageX, event.pageY, event.pageX, event.pageY))) {
                                    if (childs[i].scope().isSelected === false) {
                                        childs[i].scope().isSelected = true;
                                        childs[i].scope().$apply();
                                    }
                                }
                            }
                        }
                        // Remove listeners
                        $document.off('mousemove', mousemove);
                        $document.off('mouseup', mouseup);
                    }

                    element.on('mousedown', function(event) {
                        // Prevent default dragging of selected content
                        event.preventDefault();
                        if (!event.ctrlKey) {
                            // Skip all selected or selecting items
                            var childs = getSelectableElements(element);
                            for (var i = 0; i < childs.length; i++) {
                                if (childs[i].scope().isSelecting === true || childs[i].scope().isSelected === true) {
                                    childs[i].scope().isSelecting = false;
                                    childs[i].scope().isSelected = false;
                                    childs[i].scope().$apply();
                                }
                            }
                        }
                        // Update start coordinates
                        startX = event.pageX;
                        startY = event.pageY;
                        // Create helper
                        helper = angular
                            .element("<div></div>")
                            .addClass('select-helper');

                        $document.find('body').eq(0).append(helper);
                        // Attach events
                        $document.on('mousemove', mousemove);
                        $document.on('mouseup', mouseup);
                    });
                }
            };
        }])
        .directive('transformableItem', ['$document', '$timeout', function($document, $timeout) {

            var template = '<div class="transform-helper"><span class="transform-helper-handle rotate"></span><span class="transform-helper-handle top-right"></span><span class="transform-helper-handle top-left"></span><span class="transform-helper-handle bottom-left"></span><span class="transform-helper-handle bottom-right"></span><span class="transform-helper-handle top"></span><span class="transform-helper-handle right"></span><span class="transform-helper-handle bottom"></span><span class="transform-helper-handle left"></span></div>';

            return {
                scope: true,
                restrict: 'A',
                link: function(scope, element, iAttrs, controller) {

                    /** Padding for the transform-helper **/
                    var HELPER_PADDING = 40;
                    /** DOM element for the transformhelper **/
                    var helper = angular.element(template);
                    /** This method is called when a handler is dragged **/
                    var scaleFunction = undefined;
                    /** Last x-position of the mouse cursor */
                    var lastX = 0;
                    /** Last y-position of the mouse cursor */
                    var lastY = 0;
                    var rotateRadius;


                    function getElementOffset(element) {
                        var doc = element && element.ownerDocument;
                        var documentElem = doc.documentElement;
                        var box = {
                                top: 0,
                                left: 0
                            };
                        if (typeof element.getBoundingClientRect !== undefined) {
                            box = element.getBoundingClientRect();
                            box.top = box.top + window.scrollY;
                            box.left += window.scrollX;
                        }

                        return {
                            top: box.top + window.scrollY,
                            right: box.right + window.scrollX,
                            bottom: box.bottom + window.scrollY,
                            left: box.left + window.scrollX
                        };
                    }

                    /**
                     * Aligns the transformation helper
                     * according to the elements dimensions
                     * and position.
                     */
                    function alignHelper() {
                        if(!helper) return;
                        var box = getElementOffset(element[0]);
                        if(rotateRadius === undefined) {
                            if((box.right - box.left) < (box.bottom - box.top)) {
                                rotateRadius = (box.right - box.left);
                            }
                            else {
                                rotateRadius = (box.bottom - box.top);
                            }
                        }
                        var x = parseInt(element.css('left').replace('px', ''));
                        var y = parseInt(element.css('top').replace('px', ''));
                        var degree = getRotationDegrees(element);
                        helper.css({
                            left: x - HELPER_PADDING + 'px',
                            top: y - HELPER_PADDING + 'px',
                            width: element.width() + HELPER_PADDING * 2 + 'px',
                            height: element.height() + HELPER_PADDING * 2 + 'px',
                            'z-index': element.css('zindex') + 1,
                            '-webkit-transform': 'rotate('+ degree + 'deg)',
                            '-moz-transform': 'rotate(' + degree + 'deg)',
                            '-ms-transform': 'rotate(' + degree + 'deg)',
                            '-o-transform': 'rotate(' + degree + 'deg)',
                            'transform': 'rotate(' + degree + 'deg)'
                        });
                    }

                    function getMouseDegree(event) {
                        var box = getElementOffset(element[0]);
                        var cx = box.left + element.width()/2;
                        var cy = box.top + element.height()/2;
                        var distanceX = event.pageX - cx;
                        var distanceY = event.pageY - cy;
                        return -1 * (Math.atan2(distanceX, distanceY) * (180 / Math.PI)) -180;
                    }

                    function getRotationDegrees(obj) {
                        var matrix = obj.css("-webkit-transform") ||
                            obj.css("-moz-transform")    ||
                            obj.css("-ms-transform")     ||
                            obj.css("-o-transform")      ||
                            obj.css("transform");
                        if(matrix !== 'none') {
                            var values = matrix.split('(')[1].split(')')[0].split(',');
                            var a = values[0];
                            var b = values[1];
                            var angle = Math.round(Math.atan2(b, a) * (180/Math.PI));
                        } else { var angle = 0; }
                        return (angle < 0) ? angle + 360 : angle;
                    }


                    function mousedownTop(event) {
                        event.preventDefault();
                        lastX = event.pageX;
                        lastY = event.pageY;
                        scaleFunction = function(event) {
                            var offset = event.pageY - lastY;
                            var oldTop = parseInt(element.css('top').replace('px', ''));
                            element.css({
                                height: element.height() - offset + 'px',
                                top: oldTop + offset + 'px'
                            });
                        };
                        $document.on('mousemove', mousemove);
                        $document.on('mouseup', mouseup);
                    }

                    function mousedownScaleTop(event) {
                        event.preventDefault();
                        lastX = event.pageX;
                        lastY = event.pageY;
                        scaleFunction = function(event) {
                            var offset = event.pageY - lastY;
                            var oldTop = parseInt(element.css('top').replace('px', ''));
                            var oldLeft = parseInt(element.css('left').replace('px', ''));
                            element.css({
                                height: element.height() - offset * 2 + 'px',
                                top: oldTop + offset + 'px',
                                width: element.width() - offset * 2 + 'px',
                                left: oldLeft + offset + 'px'
                            });
                        };
                        $document.on('mousemove', mousemove);
                        $document.on('mouseup', mouseup);
                    }

                    function mousedownScaleBottom(event) {
                        event.preventDefault();
                        lastX = event.pageX;
                        lastY = event.pageY;
                        scaleFunction = function(event) {
                            var offset = event.pageY - lastY;
                            var oldTop = parseInt(element.css('top').replace('px', ''));
                            var oldLeft = parseInt(element.css('left').replace('px', ''));
                            element.css({
                                height: element.height() + offset * 2 + 'px',
                                top: oldTop - offset + 'px',
                                width: element.width() + offset * 2 + 'px',
                                left: oldLeft + offset - 'px'
                            });
                        };
                        $document.on('mousemove', mousemove);
                        $document.on('mouseup', mouseup);
                    }

                    function mousedownLeft(event) {
                        event.preventDefault();
                        lastX = event.pageX;
                        lastY = event.pageY;
                        scaleFunction = function(event) {
                            var offset = event.pageX - lastX;
                            var oldLeft = parseInt(element.css('left').replace('px', ''));
                            element.css({
                                width: element.width() - offset + 'px',
                                left: oldLeft + offset + 'px'
                            });
                        };
                        $document.on('mousemove', mousemove);
                        $document.on('mouseup', mouseup);
                    }

                    function mousedownBottom(event) {
                        event.preventDefault();
                        lastX = event.pageX;
                        lastY = event.pageY;
                        scaleFunction = function(event) {
                            element.css({
                                height: element.height() + event.pageY - lastY + 'px'
                            });
                        };
                        $document.on('mousemove', mousemove);
                        $document.on('mouseup', mouseup);
                    }

                    function mousedownRight(event) {
                        event.preventDefault();
                        lastX = event.pageX;
                        lastY = event.pageY;
                        scaleFunction = function(event) {
                            element.css({
                                width: element.width() + event.pageX - lastX + 'px'
                            });
                        };
                        $document.on('mousemove', mousemove);
                        $document.on('mouseup', mouseup);
                    }

                    function mousedownRotate(event) {
                        event.preventDefault();
                        lastX = event.pageX;
                        lastY = event.pageY;
                        var box = getElementOffset(element[0]);
                        scaleFunction = function(event) {
                            var degree = getMouseDegree(event);
                            element.css({
                                '-webkit-transform': 'rotate('+ degree + 'deg)',
                                '-moz-transform': 'rotate(' + degree + 'deg)',
                                '-ms-transform': 'rotate(' + degree + 'deg)',
                                '-o-transform': 'rotate(' + degree + 'deg)',
                                'transform': 'rotate(' + degree + 'deg)'
                            });
                            alignHelper();
                        };
                        helper.addClass('rotating');
                        $document.on('mousemove', mousemove);
                        $document.on('mouseup', mouseup);
                    }

                    /**
                     * Will be called when a handler is dragged.
                     * @param event
                     */
                    function mousemove(event) {
                        event.preventDefault();
                        scaleFunction(event);
                        lastX = event.pageX;
                        lastY = event.pageY;
                        scope.$apply();
                    }

                    /**
                     * Will be called when a handler is released.
                     * @param event Mouseevent
                     */
                    function mouseup(event) {
                        event.preventDefault();
                        rotateRadius = undefined;
                        helper.removeClass('rotating');
                        $document.off('mousemove', mousemove);
                        $document.off('mouseup', mouseup);
                    }

                    /**
                     * Watch for changes of the element dimension
                     * and align the transformation-helper accordingly.
                     */
                    scope.$watch(function() {
                       return [
                           element.css('height'),
                           element.css('width'),
                           element.css('top'),
                           element.css('left')
                       ];
                    }, alignHelper, true);

                    /**
                     * Check if the element is selected and
                     * display the transformation helper if
                     * the element is selected.
                     */
                    scope.$watch(function() { return element.scope().isSelected; }, function(newValue, oldValue) {
                        if(newValue) {
                            $document.find('body').eq(0).append(helper);
                            helper.find('.transform-helper-handle.bottom').on('mousedown', mousedownBottom);
                            helper.find('.transform-helper-handle.right').on('mousedown', mousedownRight);
                            helper.find('.transform-helper-handle.top').on('mousedown', mousedownTop);
                            helper.find('.transform-helper-handle.left').on('mousedown', mousedownLeft);
                            helper.find('.transform-helper-handle.rotate').on('mousedown', mousedownRotate);
                            helper.find('.transform-helper-handle.top-right').on('mousedown', mousedownScaleTop);
                            helper.find('.transform-helper-handle.top-left').on('mousedown', mousedownScaleTop);
                            helper.find('.transform-helper-handle.bottom-left').on('mousedown', mousedownScaleBottom);
                            helper.find('.transform-helper-handle.bottom-right').on('mousedown', mousedownScaleBottom);
                            helper.find('.transform-helper-handle.rotate');
                            alignHelper();
                        }
                        else {
                            helper.remove();
                        }
                    });


                }
            }
        }]);

})();
