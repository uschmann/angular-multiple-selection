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

            var template = '<div class="transform-helper"> <span class="transform-helper-handle top"></span><span class="transform-helper-handle right"></span><span class="transform-helper-handle bottom"></span><span class="transform-helper-handle left"></span></div>';

            return {
                scope: true,
                restrict: 'A',
                link: function(scope, element, iAttrs, controller) {

                    var HELPER_PADDING = 25;
                    var helper = angular.element(template);
                    var lastX = 0;
                    var lastY = 0;
                    var handleTop = helper.find('.transform-helper-handle.top');

                    function alignHelper() {
                        var elementOffset = offset(element[0]);
                        helper.css({
                            left: elementOffset.left - HELPER_PADDING + 'px',
                            top: elementOffset.top - HELPER_PADDING + 'px',
                            width: element.width() + HELPER_PADDING*2 + 'px',
                            height: element.height() + HELPER_PADDING*2 + 'px'
                        });
                    }

                    function mousedownVertical(event) {
                        selectedHandle = handleTop;
                        event.preventDefault();
                        lastX = event.pageX;
                        lastY = event.pageY;
                        $document.on('mousemove', mousemoveVertical);
                        $document.on('mouseup', mouseup);
                    }

                    function mousedownHorizontal(event) {
                        selectedHandle = handleTop;
                        event.preventDefault();
                        lastX = event.pageX;
                        lastY = event.pageY;
                        $document.on('mousemove', mousemoveHorizontal);
                        $document.on('mouseup', mouseup);
                    }

                    function mousemoveVertical(event) {
                        event.preventDefault();
                        element.css({
                            height: element.height() + event.pageY - lastY + 'px'
                        });
                        lastY = event.pageY;
                        scope.$apply();
                    }

                    function mousemoveHorizontal(event) {
                        event.preventDefault();
                        element.css({
                            width: element.width() + event.pageX - lastX + 'px'
                        });
                        lastX = event.pageX;
                        scope.$apply();
                    }

                    function mouseup(event) {
                        event.preventDefault();
                        $document.off('mousemove', mousemoveVertical);
                        $document.off('mousemove', mousemoveHorizontal);
                        $document.off('mouseup', mouseup);
                    }

                    scope.$watch(function() {
                       return [
                           element.css('height'),
                           element.css('width'),
                           element.css('top'),
                           element.css('left')
                       ];
                    }, alignHelper, true);

                    scope.$watch(function() {
                        return element.scope().isSelected;
                    }, function(newValue, oldValue) {
                        if(newValue) {
                            $document.find('body').eq(0).append(helper);
                            helper.find('.transform-helper-handle.bottom').on('mousedown', mousedownVertical);
                            helper.find('.transform-helper-handle.right').on('mousedown', mousedownHorizontal);
                            helper.find('.transform-helper-handle.top').on('mousedown', mousedownVertical);
                            helper.find('.transform-helper-handle.left').on('mousedown', mousedownHorizontal);
                        }
                        else {
                            helper.remove();
                        }
                    });


                }
            }
        }]);

})();
