/*global
    window, console, Math, d3, jQuery, $
*/

/**
 * Webtrees module.
 *
 * Copyright (C) 2017  Rico Sonntag
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301  USA
 */

/**
 * jQuery widget "rso.ancestralFanChart"
 */
(function ($) {
    'use strict';

    $.widget('rso.ancestralFanChart', {
        options: {
            // Number of generations to display
            generations: 5,

            // Default background color of an arc
            defaultColor: '#eee',

            nameSwitchThreshold: 5,

            // Default font size, color and scaling
            fontSize: 13,
            fontColor: '#000',
            fontScale: 100,

            // Degrees of the fan chart
            fanDegree: 360,

            startPi: -Math.PI,
            endPi: Math.PI,

            width: 1200,
            height: 1200,
            padding: 5,

            x: null
        },

        config: {
        },

        /**
         * Initialize the tool.
         *
         * @constructs ancestralFanChart
         */
        _create: function () {
            // Check dependencies
            this.checkDependencies();

            this.options.startPi = -(this.options.fanDegree / 360 * Math.PI);
            this.options.endPi = (this.options.fanDegree / 360 * Math.PI);

            // Scale the angles linear across the circle
            this.options.x = d3.scaleLinear().range([this.options.startPi, this.options.endPi]);

            // Start bootstrapping
            this.initChart();
            this.initData(this.options.data);
            this.createArcElements();
            this.updateViewBox();
        },

        /**
         * Check widget dependencies
         *
         * @returns {boolean}
         * @private
         */
        checkDependencies: function () {
            // Confirm d3 is available [check minimum version]
            if (typeof d3 !== 'object' || !d3.hasOwnProperty('version')) {
                console.error('d3 error: d3 is not available');
                console.info(typeof d3);
                return false;
            }

            return true;
        },

        /**
         * Create an empty child node object.
         *
         * @param {number} generation Generation of the node
         *
         * @return {object}
         */
        createEmptyNode: function (generation) {
            return {
                id: '',
                name: '',
                generation: generation,
                color: this.options.defaultColor
            }
        },

        /**
         * Initialize the chart.
         *
         * @private
         */
        initChart: function () {
            this.config.visual = d3
                .select('#fan_chart')
                .append('svg')
                .attr('width', this.options.width + (this.options.padding << 1))
                .attr('height', this.options.height + (this.options.padding << 1))
                .attr('text-rendering', 'geometricPrecision')
                .attr('text-anchor', 'middle')
                .append('g')
                .attr('class', 'group');
        },

        /**
         * Initialize the chart data.
         *
         * @param {object} data JSON encoded data
         *
         * @private
         */
        initData: function (data) {
            var that = this;

            // Construct root node
            var root = d3.hierarchy(
                data,
                function (d) {
                    // Fill up the missing children to the requested number of generations
                    if (!d.children && (d.generation < that.options.generations)) {
                        return [
                            that.createEmptyNode(d.generation + 1),
                            that.createEmptyNode(d.generation + 1)
                        ];
                    }

                    // Add missing parent record if we got only one
                    if (d.children && (d.children.length < 2)) {
                        if (d.children[0].sex === 'M') {
                            // Append empty node if we got an father
                            d.children
                                .push(that.createEmptyNode(d.generation + 1));
                        } else {
                            // Else prepend empty node
                            d.children
                                .unshift(that.createEmptyNode(d.generation + 1));
                        }
                    }

                    return d.children;
                })
                // Calculate number of leaves
                .count();

            var partition = d3.partition();
            this.config.nodes = partition(root).descendants();
        },

        /**
         * Update the viewBox attribute of the SVG element.
         */
        updateViewBox: function () {
            // Adjust size of svg
            var boundingBox = this.config.visual.node().getBBox();
            var radius      = boundingBox.width / 2;

            d3.select(this.config.visual.node().parentNode)
                .attr('width', boundingBox.width + (this.options.padding << 1))
                .attr('height', boundingBox.height + (this.options.padding << 1));

            this.config.visual.attr(
                'transform',
                'translate(' + [radius + this.options.padding, radius + this.options.padding] + ')'
            );
        },

        /**
         * Get the start angle.
         *
         * @param {object} d D3 data object
         *
         * @returns {number}
         */
        startAngle: function (d) {
            return Math.max(
                this.options.startPi,
                Math.min(this.options.endPi, this.options.x(d.x0))
            );
        },

        /**
         * Get the end angle.
         *
         * @param {object} d D3 data object
         *
         * @returns {number}
         */
        endAngle: function (d) {
            return Math.max(
                this.options.startPi,
                Math.min(this.options.endPi, this.options.x(d.x1))
            );
        },

        /**
         * Get the inner radius depending on the depth of an element.
         *
         * @param {object} d D3 data object
         *
         * @returns {number}
         */
        innerRadius: function (d) {
            var data = [0, 65, 130, 195, 260, 325, 440, 555, 670, 785];
            return data[d.depth];
        },

        /**
         * Get the outer radius depending on the depth of an element.
         *
         * @param {object} d D3 data object
         *
         * @returns {number}
         */
        outerRadius: function (d) {
            var data = [65, 130, 195, 260, 325, 440, 555, 670, 785, 900];
            return data[d.depth];
        },

        /**
         * Get the center radius.
         *
         * @param {object} d D3 data object
         *
         * @returns {number}
         */
        centerRadius: function (d) {
            return (this.innerRadius(d) + this.outerRadius(d)) / 2;
        },

        /**
         * Get an radius relative to the outer radius adjusted by the given
         * position in percent.
         *
         * @param {object} d        D3 data object
         * @param {number} position Percent offset (0 = inner radius, 100 = outer radius)
         *
         * @returns {number}
         */
        relativeRadius: function (d, position) {
            var outerRadius = this.outerRadius(d);
            return outerRadius - ((100 - position) * (outerRadius - this.innerRadius(d)) / 100);
        },

        /**
         * Draws the borders of the single arcs.
         */
        createArcElements: function () {
            var that = this;

            var arcGenerator = d3.arc()
                .startAngle(function (d) {
                    return (d.depth === 0) ? 0 : that.startAngle(d);
                })
                .endAngle(function (d) {
                    return (d.depth === 0) ? (Math.PI * 2) : that.endAngle(d);
                })
                .innerRadius(this.innerRadius)
                .outerRadius(this.outerRadius);

            var personGroup = this.config.visual
                .selectAll('g.person')
                .data(this.config.nodes)
                .enter()
                .append('g')
                .attr('class', 'person');

            // Append click event only to existing elements
            personGroup.filter(function (d) {
                    return (d.data.id !== '');
                })
                .on('click', $.proxy(this.update, this));

            this.appendTitle(personGroup);
            this.appendArc(personGroup, arcGenerator);
            this.appendLabels(personGroup);
        },

        /**
         * Append a title element containing the full name of the individual
         * to the person group.
         *
         * @param {object} parent Parent element used to append the title
         */
        appendTitle: function (parent) {
            // Add title element containing the full name of the individual
            parent.append('title')
                .text(function (d) {
                    // Return name or remove empty element
                    return (d.data.id !== '') ? d.data.name : this.remove();
                });
        },

        /**
         * Append a path element using the given arc generator.
         *
         * @param {object}   parent       Parent element used to append the new path
         * @param {function} arcGenerator Arc generator
         */
        appendArc: function (parent, arcGenerator) {
            parent.append('g')
                .attr('class', 'arc')
                .append('path')
                .attr('fill', function (d) {
                    return d.data.color;
                })
                .attr('d', arcGenerator);
        },

        /**
         * Append the labels for an arc.
         *
         * @param {object} parent Parent element used to append the labels
         */
        appendLabels: function (parent) {
            var that = this;

            var group = parent
                .append('g')
                .style('fill', this.options.fontColor)
                .attr('class', 'label');

            // Inner labels
            var innerLabels = group
                .filter(function (d) {
                    return ((d.data.id !== '')
                        && (d.depth > 0)
                        && (d.depth < that.options.nameSwitchThreshold));
                });

            innerLabels.each(function (d) {
                var parent   = d3.select(this);
                var timeSpan = that.getTimeSpan(d);

                // Relative position offsets in percent (0 = inner radius, 100 = outer radius)
                var positions = [70, 52, 25];

                // Flip label positions for 360 degree chart
                if (that.isPositionFlipped(d)) {
                    positions = [30, 48, 75];
                }

                // Create a path for each line of text as mobile devices
                // won't display <tspan> elements in the right position
                that.appendArcPath(parent, 0, positions[0]);
                that.appendArcPath(parent, 1, positions[1]);

                if (timeSpan) {
                    that.appendArcPath(parent, 2, positions[2]);
                }

                // Append text element
                var text = parent
                    .append('text')
                    .attr('dominant-baseline', 'middle')
                    .style('font-size', function (d) {
                        return that.getFontSize(d);
                    })
                    .style('fill', that.options.fontColor);

                // Append textPath elements along to create paths
                that.appendInnerArcTextPath(text, 0, that.getFirstNames(d));
                that.appendInnerArcTextPath(text, 1, that.getLastName(d));

                if (timeSpan) {
                    that.appendInnerArcTextPath(text, 2, timeSpan, 'chart-date');
                }
            });

            // Outer labels
            var outerLabels = group
                .filter(function (d) {
                    return ((d.data.id !== '')
                        && (d.depth === 0)
                        || (d.depth >= that.options.nameSwitchThreshold));
                });

            outerLabels.each(function (d) {
                var parent   = d3.select(this);
                var name     = d.data.name;
                var timeSpan = that.getTimeSpan(d);

                // Return first name for inner circles
                if (d.depth < 7) {
                    name = that.getFirstNames(d);
                }

                // Create the text elements for first name, last name and
                // the birth/death dates
                that.appendOuterArcText(parent, name);

                // Outer circles only show the names
                if (d.depth < 7) {
                    // Add last name
                    that.appendOuterArcText(parent, that.getLastName(d));

                    // Add dates
                    if ((d.depth < 6) && timeSpan) {
                        that.appendOuterArcText(parent, timeSpan, 'chart-date');
                    }
                }
            });

            this.transformText(outerLabels);
        },

        /**
         * Update the chart with data loaded from AJAX.
         *
         * @param {object} d D3 data object
         */
        update: function (d) {
            var that = this;

            d3.json(
                'module.php?ged=Sonntag&mod=ancestral-fan-chart&mod_action=update&rootid=' + d.data.id + '&generations=' + that.options.generations,
                function (data) {
                    d3.select('#fan_chart').select('svg').remove();

                    that.initChart();
                    that.initData(data);
                    that.createArcElements();
                    that.updateViewBox();
                }
            );
        },

        /**
         * Truncates the text of the current element depending on its depth
         * in the chart.
         *
         * @param {int} padding Left/Right padding of text
         *
         * @returns {string} Truncated text
         */
        truncate: function (padding) {
            var that = this;

            return function (d) {
                // Modifier of available width depending on fan degrees
                var widthMod = that.options.fanDegree / 360;

                // Depending on the depth of an entry in the chart the available width differs
                var availableWidth = 110;

                if (d.depth === 1) {
                    availableWidth = 280 * widthMod;
                }

                if (d.depth === 2) {
                    availableWidth = 230 * widthMod;
                }

                if (d.depth === 3) {
                    availableWidth = 160 * widthMod;
                }

                if (d.depth === 4) {
                    availableWidth = 110 * widthMod;
                }

                var self = d3.select(this),
                    textLength = self.node().getComputedTextLength(),
                    text = self.text();

                while ((textLength > (availableWidth - (padding << 1))) && (text.length > 0)) {
                    // Remove last char
                    text = text.slice(0, -1);

                    // Recalculate the text width
                    textLength = self
                        .text(text + '...')
                        .node()
                        .getComputedTextLength();
                }
            };
        },

        /**
         * Get the first names of an person.
         *
         * @param {object} d D3 data object
         *
         * @return {string}
         */
        getFirstNames: function (d) {
            return d.data.name.substr(0, d.data.name.lastIndexOf(' '));
        },

        /**
         * Get the last name of an person.
         *
         * @param {object} d D3 data object
         *
         * @return {string}
         */
        getLastName: function (d) {
            return d.data.name.substr(d.data.name.lastIndexOf(' ') + 1);
        },

        /**
         * Get the time span label of an person. Returns null if label
         * should not be displayed due empty data.
         *
         * @param {object} d D3 data object
         *
         * @return {string}
         */
        getTimeSpan: function (d) {
            if (d.data.born || d.data.died) {
                return d.data.born + '-' + d.data.died;
            }

            return null;
        },

        /**
         * Get the scaled font size.
         *
         * @param {object} d D3 data object
         *
         * @return {string}
         */
        getFontSize: function (d) {
            var fontSize = this.options.fontSize;

            if (d.depth >= (this.options.nameSwitchThreshold + 1)) {
                fontSize += 1;
            }

            return ((fontSize - d.depth) * this.options.fontScale / 100) + 'px';
        },

        /**
         * Check for the 360 degree chart if the current arc labels
         * should be flipped for easier reading.
         *
         * @param {object} d D3 data object
         *
         * @return {boolean}
         */
        isPositionFlipped: function (d) {
            if ((this.options.fanDegree !== 360) || (d.depth <= 1)) {
                return false;
            }

            var sAngle = this.startAngle(d);
            var eAngle = this.endAngle(d);

            // Flip names for better readability depending on position in chart
            return ((sAngle >= (90 * Math.PI / 180)) && (eAngle <= (180 * Math.PI / 180)))
                || ((sAngle >= (-180 * Math.PI / 180)) && (eAngle <= (-90 * Math.PI / 180)));
        },

        /**
         * Append a path element to the given parent group element.
         *
         * @param {object} parent   Parent container element, D3 group element
         * @param {int}    index    Index position of element in parent container.
         *                          Required to create a unique path id.
         * @param {int}    position Relative position offset for path
         *                          (0 = inner radius, 100 = outer radius)
         */
        appendArcPath: function (parent, index, position) {
            var that = this;

            // Create arc generator for path segments
            var arcGenerator = d3.arc()
                .startAngle(function (d) {
                    return that.isPositionFlipped(d)
                        ? that.endAngle(d)
                        : that.startAngle(d);
                })
                .endAngle(function (d) {
                    return that.isPositionFlipped(d)
                        ? that.startAngle(d)
                        : that.endAngle(d);
                })
                .innerRadius(function (d) {
                    return that.relativeRadius(d, position);
                })
                .outerRadius(function (d) {
                    return that.relativeRadius(d, position);
                });

            // Append a path so we could use it to write the label along it
            parent.append('path')
                .attr('d', arcGenerator)
                .attr('id', function (d) {
                    return 'label-' + d.data.id + '-' + index;
                });
        },

        /**
         * Append textPath element with label along the referenced path.
         *
         * @param {object} parent        Parent container element, D3 text element
         * @param {int}    index         Index position of element in parent container
         * @param {string} label         Label to display
         * @param {string} textPathClass Optional class to set to the D3 textPath element
         */
        appendInnerArcTextPath: function (parent, index, label, textPathClass) {
            parent.append('textPath')
                .attr('class', textPathClass || null)
                .attr('startOffset', '25%')
                .attr('xlink:href', function (d) {
                    return '#label-' + d.data.id + '-' + index;
                })
                .text(label)
                .each(this.truncate(5));
        },

        /**
         * Append text element to the given group element.
         *
         * @param {object} group     D3 group (g) object
         * @param {string} label     Label to display
         * @param {string} textClass Optional class to set to the D3 text element
         *
         * @return {object} D3 text object
         */
        appendOuterArcText: function (group, label, textClass) {
            var that = this;

            group.append('text')
                .filter(function (d) {
                    return (d.data.id !== '') ? true : this.remove();
                })
                .attr('class', textClass || null)
                .attr('dominant-baseline', 'middle')
                .style('font-size', function (d) {
                    return that.getFontSize(d);
                })
                .text(label)
                .each(this.truncate(5));
        },

        /**
         * Transform the D3 text elements in the group. Rotate each text element
         * depending on its offset, so that they are equally positioned inside
         * the arc.
         *
         * @param {object} group D3 group object
         */
        transformText: function (group) {
            var that = this;

            group.each(function (d) {
                var textElements = d3.select(this).selectAll('text');
                var countElements = textElements.size();
                var offset = 0;

                textElements.each(function (d, i) {
                    if (countElements === 1) {
                        offset = 0;
                    }

                    if (countElements === 2) {
                        offset = 0.5;
                    }

                    if (countElements === 3) {
                        offset = 1.25;
                    }

                    var mapIndexToOffset = d3.scaleLinear()
                        .domain([0, countElements - 1])
                        .range([-offset, offset]);

                    var offsetRotate = (i <= 1 ? 1.25 : 1.75);

                    if (d.depth === 0) {
                        offsetRotate = 1.00;
                    }

                    if (d.depth === 6) {
                        offsetRotate = 1.00;
                    }

                    if (d.depth === 7) {
                        offsetRotate = 0.75;
                    }

                    if (d.depth === 8) {
                        offsetRotate = 0.5;
                    }

                    offsetRotate *= that.options.fontScale / 100;

                    var text = d3.select(this);

                    // Name of center person should not be rotated in any way
                    if (d.depth === 0) {
                        text.attr('dy', (mapIndexToOffset(i) * offsetRotate) + 'em');
                    } else {
                        text.attr('transform', function (d) {
                            var dx     = d.x1 - d.x0;
                            var angle  = that.options.x(d.x0 + (dx / 2)) * 180 / Math.PI;
                            var rotate = angle - (mapIndexToOffset(i) * offsetRotate * (angle > 0 ? -1 : 1)) - 90;

                            return 'rotate(' + rotate + ') '
                                + 'translate(' + that.centerRadius(d) + ') '
                                + 'rotate(' + (angle > 0 ? 0 : 180) + ')';
                        });
                    }
                });
            });
        }
    });
}(jQuery));
