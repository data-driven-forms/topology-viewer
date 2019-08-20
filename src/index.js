import React, { Component, createRef } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import './style.scss';
import roundedPolygon from './roundedPolygon';

const NODE_SIZE = 25;

const levelColors = [ '#FFF', '#f5f5f5', '#d2d2d2', '#d2d2d2' ];
const levelStrokeWidth = [ NODE_SIZE * 5.5, NODE_SIZE * 4, NODE_SIZE * 3 ];

const circlePath = (cx, cy, r, offset = 0) => `M ${cx + offset},${cy}
m ${-r}, 0
a ${r},${r} 0 1,0 ${r * 2}, 0
a ${r},${r} 0 1,0 -${r * 2}, 0`;

const squarePath = (edgeSize, cornerCurve = 5, offset = 0) =>`M${cornerCurve + 2 + offset},2
h${edgeSize - cornerCurve * 2}
a${cornerCurve},${cornerCurve} 0 0 1 ${cornerCurve},${cornerCurve}
v${edgeSize - cornerCurve * 2}
a${cornerCurve},${cornerCurve} 0 0 1 -${cornerCurve},${cornerCurve}
h-${edgeSize - cornerCurve * 2}
a${cornerCurve},${cornerCurve} 0 0 1 -${cornerCurve},-${cornerCurve}
v-${edgeSize - cornerCurve * 2}
a${cornerCurve},${cornerCurve} 0 0 1 ${cornerCurve},-${cornerCurve} z
`;

const hexagonPath = (edgeSize, cornerCurve = 5, offsetX) => roundedPolygon(edgeSize, cornerCurve, offsetX).path;

const mergeAttributes = [ 'x', 'y', 'fx', 'fy', 'vx', 'vy' ];
const mergeArrays = (arr1, arr2, mergeKey) => {
  arr1.forEach(item1 => {
    const item2 = arr2.find(i => item1[mergeKey] === i[mergeKey]) || {};
    mergeAttributes.forEach(key => {
      item1[key] = item2[key];
    });
  });
  return arr1;
};

class TopologyCanvas extends Component {
  constructor(props) {
    super(props);
    this.svgRef = createRef(null);
    this.nodes = [ ...this.props.nodes ];
    this.edges = [ ...this.props.edges ];
    this.selectedNode = {};
    this.transform = {
      x: 0,
      y: 0,
      k: 1,
    };
    this.overflowIndicators = [
      { position: 'top', nodes: []},
      { position: 'left', nodes: []},
      { position: 'bottom', nodes: []},
      { position: 'right', nodes: []},
    ];
    this.lastClickCoords = {};
    window.magix = this;
  }
  dragStarted = (d) => {
    d3.event.sourceEvent.stopPropagation();
    if (!d3.event.active) {this.simulation.alphaTarget(0.3).restart();}

    d.fx = d.x;
    d.fy = d.y;
  }

  dragged = (d) => {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  dragEnded = (d) => {
    if (!d3.event.active) {
      this.simulation.alphaTarget(0);
    }

    if (d3.event.subject.dragStart) {
      d.fx = null;
      d.fy = null;

    } else {
      d.fx = d.x;
      d.fy = d.y;
    }

  }

  handleNodeClick = node => {
    node.fx = null;
    node.xy = null;
    this.selectedNode = node;
    console.log(d3.event);
    this.lastClickCoords = {
      x: d3.event.x,
      y: d3.event.y,
    };

    return this.props.handleNodeClick(node);
  }

  updateGraph = () => {
    /**
     * ******************************************************************
     * Nodes updates
     */
    let node = this.nodeElements;
    const data = mergeArrays(this.props.nodes, this.nodes, 'id').map(node => {
      if (!node.x) {
        node.x = this.lastClickCoords.x;
      }

      if (!node.y) {
        node.y = this.lastClickCoords.y;
      }

      return node;
    });

    this.nodes = data;
    // Apply the general update pattern to the nodes.
    node = node.data(data, d => d.id);

    node.exit().remove();
    /**
     * Main node container
     */
    node = node.enter().append('svg')
    .on('click', this.handleNodeClick)
    .attr('style', 'filter:url(#dropshadow)')
    .call(d3.drag().on('start', this.dragStarted).on('drag', this.dragged).on('end', this.dragEnded))
    .merge(node)
    .attr('class', node => `${this.props.classNamePrefix}__node ${node.children === undefined ? '' : 'group'}`);

    /**
      * Remove all nested elements
      */
    node.selectAll('*').remove();
    node.append('path')
    .attr('class', 'layer-2')
    .attr('d', ({ nodeShape }) => {
      if (nodeShape === 'square') {
        return squarePath((NODE_SIZE) * 2, 5, 10);
      }

      if (nodeShape === 'hexagon') {
        return hexagonPath(NODE_SIZE, 5, 11);
      }

      return circlePath(NODE_SIZE, NODE_SIZE, NODE_SIZE, 12);
    });
    /**
     * Group node first layer
     */
    node.append('path')
    .attr('class', 'layer-1')
    .attr('d', ({ nodeShape }) => {
      if (nodeShape === 'square') {
        return squarePath((NODE_SIZE) * 2, 5, 5);
      }

      if (nodeShape === 'hexagon') {
        return hexagonPath(NODE_SIZE, 5, 5);
      }

      return circlePath(NODE_SIZE, NODE_SIZE, NODE_SIZE, 6);
    });

    /**
     * Node circle
     */
    node.append('path')
    .attr('class', ({ children }) => `${this.props.classNamePrefix}__node ${children ? 'grouped' : ''}`)
    .attr('d', ({ nodeShape }) => {
      if (nodeShape === 'square') {
        return squarePath((NODE_SIZE - 2) * 2, 5);
      }

      if (nodeShape === 'hexagon') {
        return hexagonPath(NODE_SIZE - 2);
      }

      return circlePath(NODE_SIZE, NODE_SIZE, NODE_SIZE - 2);
    });
    /**
     * Node border
     */
    node.append('path')
    .attr('class', `${this.props.classNamePrefix}__node-border`)
    .attr('d', ({ nodeShape }) => {
      if (nodeShape === 'square') {
        return squarePath((NODE_SIZE - 2) * 2, 5);
      }

      if (nodeShape === 'hexagon') {
        return hexagonPath(NODE_SIZE - 2);
      }

      return circlePath(NODE_SIZE, NODE_SIZE, NODE_SIZE - 2);
    });
    /**
     * Node icon
     */
    node.
    append('svg')
    .attr('width', NODE_SIZE)
    .attr('height', NODE_SIZE)
    .attr('x', NODE_SIZE / 2)
    .attr('y', NODE_SIZE / 2)
    .attr('viewBox', node => this.props.iconMapper[node.nodeType]
      ? `0 -64 ${this.props.iconMapper[node.nodeType].width} ${this.props.iconMapper[node.nodeType].height}`
      : '')
    .append('path')
    .attr('fill', '#151515')
    .attr('class', `${this.props.classNamePrefix}__node-icon`)
    .attr('d', node => this.props.iconMapper[node.nodeType].svgPathData);
    this.nodeElements = node;

    /**
     * Node group chip
     */
    const childrenChip = node
    .append('svg')
    .attr('display', ({ children }) => children === undefined ? 'none' : 'initial');
    childrenChip
    .append('rect')
    .attr('width', node => {
      const temp = document.createElement('label');
      temp.innerHTML = node.children;
      document.getElementById('svg-container').append(temp);
      const width = temp.getBoundingClientRect().width;
      document.getElementById('svg-container').removeChild(temp);
      node.width = width;
      return width + 10;
    })
    .attr('class', `${this.props.classNamePrefix}__grouped-node-children-chip`);

    childrenChip
    .append('svg')
    .attr('x', 45)
    .attr('y', 30)
    .attr('overflow', 'visible')
    .attr('class', `${this.props.classNamePrefix}__grouped-node-children-chip-text-cotainer`)
    .append('text')
    .text(node => node.children || '')
    .attr('class', `${this.props.classNamePrefix}__grouped-node-children-chip-text`);

    /**
     * END OF NODE UPDATE
     * *****************************************************************
     */

    /**
     * NODE LABEL ELEMENTS
     * *****************************************************************
     */
    let label = this.textElements;
    label = label.data(data, d => d.id);
    label.exit().remove();
    label.selectAll('*').remove();
    label = label
    .enter()
    .append('svg')
    .attr('id', ({ id }) =>  `title-${id}`)
    .attr('width', node => {
      const temp = document.createElement('label');
      temp.innerHTML = node.title;
      document.getElementById('svg-container').append(temp);
      const width = temp.getBoundingClientRect().width;
      node.height = temp.getBoundingClientRect().height + 15;
      document.getElementById('svg-container').removeChild(temp);
      node.width = width + 10;
      return width + 40;
    })
    .attr('class', `${this.props.classNamePrefix}__label-cotainer`)
    .merge(label)
    .attr('width', node => {
      const temp = document.createElement('label');
      temp.innerHTML = node.title;
      document.getElementById('svg-container').append(temp);
      const width = temp.getBoundingClientRect().width;
      node.height = temp.getBoundingClientRect().height + 15;
      document.getElementById('svg-container').removeChild(temp);
      node.width = width + 10;
      return width + 40;
    });

    label.append('rect')
    .attr('width', ({ width }) => width)
    .attr('class', `${this.props.classNamePrefix}__label-background`)
    .attr('style', 'filter:url(#dropshadow)');
    label.append('text')
    .text(node => node.title)
    .attr('x', 5)
    .attr('y', 17.5)
    .attr('class', `${this.props.classNamePrefix}__label-text`);

    this.textElements = label;
    /**
     * END OF NODE LABEL ELEMENTS
     * *****************************************************************
     */
    /**
     * *****************************************************************
     * START OF LEVEL ELEMENTS
     */
    /**
     * Compute groups
     */
    this.groups = {};
    this.nodes.forEach(node => {
      if (!this.groups[node.group]) {
        this.groups[node.group] = {
          nodes: [],
          levels: {},
        };
      }

      this.groups[node.group].nodes.push(node);
    });

    Object.keys(this.groups).forEach(key => {
      const levelValues = Array.from(new Set(this.groups[key].nodes.filter(({ level }) => level !== undefined).map(({  level }) => level)));
      const levels = levelValues.reduce((acc, curr) => ({ ...acc, [curr]: []}), {});
      this.groups[key].nodes.forEach(node => {
        if (node.level !== undefined) {
          const includeInto = levelValues.filter(level => level <= node.level);
          includeInto.forEach(level => levels[level].push(node));
        }
      });
      this.groups[key].levels = levels;
    });
    /**
     * compute level nodes
     */
    const allLevels = Object.values(this.groups)
    .filter(({ levels }) => levels && Object.keys(levels).length > 0)
    .map(({ levels }) => Object.values(levels)).flat();

    let level = this.levelGroup;
    level = level.data(allLevels);
    level.exit().remove();
    level.selectAll('*').remove();
    level = level
    .enter()
    .append('path')
    .attr('stroke-width', nodes => levelStrokeWidth[Math.min(...nodes.map(({ level }) => level))])
    .merge(level)
    .attr('stroke-width', nodes => levelStrokeWidth[Math.min(...nodes.map(({ level }) => level))]);

    this.levelGroup = level;
    /**
     * END OF LEVEL ELEMENTS
     * *****************************************************************
     */
    /**
     * *****************************************************************
     * START OF OVERFLOW INDICATORS
     */
    this.overflowIndicators = this.overflowIndicators.map(indicator => ({ ...indicator, nodes: this.nodes }));

    let overflow = this.overflowIndicatorsElements;
    overflow = overflow.data(this.overflowIndicators);
    overflow.exit().remove();
    overflow.selectAll('*').remove();

    overflow = overflow
    .enter()
    .append('svg')
    .attr('width', this.props.textIndicatorAttrs.width + 20)
    .merge(overflow);

    const getBackdropHeight = position => ({
      bottom: 60,
      top: 60,
      left: 50,
      right: 50,
    })[position];

    const getBackdropWidth = position => ({
      bottom: 70,
      top: 70,
      left: 100,
      right: 100,
    })[position];

    const getBackdropX = position => ({
      bottom: 0,
      top: 0,
      left: -30,
      right: 0,
    })[position];

    const getBackdropY = position => ({
      bottom: 0,
      top: -10,
      left: 0,
      right: 0,
    })[position];

    overflow
    .append('rect')
    .attr('width', () => this.props.textIndicatorAttrs.width + 20)
    .attr('height', () => this.props.textIndicatorAttrs.height + 20)
    .attr('height', ({ position }) => getBackdropHeight(position))
    .attr('width', ({ position }) => getBackdropWidth(position))
    .attr('x', ({ position }) => getBackdropX(position))
    .attr('y', ({ position }) => getBackdropY(position))
    .attr('class', `${this.props.classNamePrefix}__overflow-text-backdrop`);

    overflow
    .append('rect')
    .attr('width', () => this.props.textIndicatorAttrs.width)
    .attr('height', () => this.props.textIndicatorAttrs.height)
    .attr('x', 10)
    .attr('y', 10)
    .attr('class', `${this.props.classNamePrefix}__overflow-text-container`);

    overflow
    .append('text')
    .attr('x', 35)
    .attr('y', 30)
    .attr('class', `${this.props.classNamePrefix}__overflow-text`);
    this.overflowIndicatorsElements = overflow;
    /**
     * END OF OVERFLOW INDICATORS
     * *****************************************************************
     */
    this.simulation.nodes(this.nodes).on('tick', this.ticked);
    /**
     * *****************************************************************
     * START OF LINK ELEMENTS
     */
    const nodeIds = this.nodes.map(({ id }) => id);
    const firstSet = nodeIds.slice(0, nodeIds.length / 2);
    const secondSet = nodeIds.slice(nodeIds.length / 2);
    let invisibleEdges = [];
    firstSet.forEach(id => {
      invisibleEdges = [ ...invisibleEdges, ...secondSet.map(node => ({ source: node, target: id, type: 'invisible' })) ];
    });
    this.edges = this.props.edges.map(edge => ({
      ...edge,
      source: this.simulation.nodes().find(({ id }) => id === edge.source),
      target: this.simulation.nodes().find(({ id }) => id === edge.target),
    }));
    this.edges = [ ...this.edges, ...invisibleEdges ];
    this.simulation.force('link').links(this.edges);

    let link = this.linkElements;
    link = link.data(this.edges, edge => edge.id);

    link.exit().remove();
    link.selectAll('link').remove();
    link = link
    .enter()
    .append('line')
    .attr('id', ({ id }) => `link-${id}`)
    .attr('class', ({ type = 'solid' }) => `${this.props.classNamePrefix}__edge-${type}`)
    .merge(link);

    this.linkElements = link;

    /**
     * END OF LINK ELEMENTS
     * *****************************************************************
     */
    /**
     * *****************************************************************
     * START OF LINK LABEL ELEMENTS
     */
    let linkLabel = this.linkLabelsElements;
    linkLabel = linkLabel.data(this.edges.filter(({ type, label }) => type !== 'invisible' && label !== undefined));
    linkLabel.exit().remove();
    linkLabel.selectAll('*').remove();
    linkLabel = linkLabel
    .enter()
    .append('svg')
    .attr('width', edge => {
      const temp = document.createElement('label');
      temp.innerHTML = edge.label;
      document.getElementById('svg-container').append(temp);
      const width = temp.getBoundingClientRect().width;
      edge.height = temp.getBoundingClientRect().height + 5;
      document.getElementById('svg-container').removeChild(temp);
      edge.width = width;
      return width + 40;
    })
    .attr('class', `${this.props.classNamePrefix}__edge-label-cotainer`)
    .merge(linkLabel)
    .attr('class', `${this.props.classNamePrefix}__edge-label-cotainer`)
    .attr('width', edge => {
      const temp = document.createElement('label');
      temp.innerHTML = edge.label;
      document.getElementById('svg-container').append(temp);
      const width = temp.getBoundingClientRect().width;
      edge.height = temp.getBoundingClientRect().height + 5;
      document.getElementById('svg-container').removeChild(temp);
      edge.width = width;
      return width + 40;
    });

    linkLabel
    .append('rect')
    .attr('width', ({ width }) => width)
    .attr('height', ({ height }) => height)
    .attr('style', 'filter:url(#dropshadow)')
    .attr('class', ({ status }) =>  `${this.props.classNamePrefix}__edge-label-background ${status || ''}`);

    linkLabel
    .append('text')
    .text(({ label }) => label)
    .attr('x', 6)
    .attr('y', 15.5)
    .attr('class', ({ status }) => `${this.props.classNamePrefix}__edge-label-text ${status || ''}`);

    this.linkLabelsElements = linkLabel;
    /**
     * END OF LINK LABEL ELEMENTS
     * *****************************************************************
     */
  }

  componentDidUpdate() {
    this.updateGraph();
  }

  componentDidMount() {
    const { width, height } = this.svgRef.current.getBoundingClientRect();
    const forceX = d3.forceX(width / 2).strength(0.1);
    const forceY = d3.forceY(height / 2).strength(0.1);
    this.svg = d3.select(this.svgRef.current)
    .append('g')
    .attr('id', 'container')
    .attr('transform', 'translate(0, 0) scale(1)');
    /**
     * polygon line
     */
    this.valueLine = d3.line()
    .x(d => d[0] + NODE_SIZE)
    .y(d => d[1])
    .curve(d3.curveCatmullRomClosed);
    /**
     * Add different element groups
     */
    this.levelGroup = this.svg.append('g').attr('id', 'levels').selectAll('g').append('g');
    this.linkElements = this.svg.append('g').attr('id', 'edges').selectAll('line');
    this.linkLabelsElements = this.svg.append('g').attr('id', 'edge-labels').selectAll('svg');
    this.nodeElements = this.svg.append('g').attr('id', 'nodes').selectAll('svg');
    this.textElements = this.svg.append('g').attr('id', 'labels').selectAll('svg');
    this.overflowIndicatorsElements = d3.select(this.svgRef.current).append('g').attr('id', 'overflow').selectAll('svg');

    this.simulation = d3.forceSimulation(this.props.nodes)
    .force('charge', d3.forceManyBody().strength(10).distanceMin(50).distanceMax(800))
    .force('x', forceX)
    .force('y',  forceY)
    .force('collision', d3.forceCollide().radius(() => NODE_SIZE * 3))
    .on('tick', this.ticked);

    this.simulation.force('link', d3.forceLink()
    .id(node => node.id)
    .distance(link => {
      if (link.source.group !== link.target.group) {
        return 800;
      }

      if (link.source.level !== link.target.level) {
        return 100;
      }

      return 150;
    })
    .strength(link => link.source.group !== link.target.group ? 0.2 : 1));

    this.zoom = d3.zoom().scaleExtent([ .1, 4 ])
    .on('zoom', () => {
      this.transform = d3.event.transform;
      this.simulation.on('tick')();
      this.svg.attr('transform', d3.event.transform);
    });
    /**
     * Add zoom to container
     */
    d3.select(this.svgRef.current).call(this.zoom);
    window.addEventListener('resize', () => {
      const { width, height } = this.svgRef.current.getBoundingClientRect();
      const forceX = d3.forceX(width / 2).strength(0.21);
      const forceY = d3.forceY(height / 2).strength(0.21);
      this.simulation
      .force('x', forceX)
      .force('y',  forceY);
      this.simulation.on('tick')();
    });

    this.updateGraph();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions);
  }

  polygonGenerator = nodes => nodes.map(({ x, y }) => [ x, y + NODE_SIZE ])

  calculateOverflow = (position, nodes, height, width) => ({
    bottom: nodes.filter(({ y }) => (y * this.transform.k + this.transform.y) > height).length,
    top: nodes.filter(({ y }) => (y * this.transform.k + this.transform.y) < 0).length,
    right: nodes.filter(({ x }) => (x * this.transform.k + this.transform.x) > width).length,
    left: nodes.filter(({ x }) => (x * this.transform.k + this.transform.x) < 0).length,
  })[position]

  calculateIndicatorX = (position, width) => ({
    top: width / 2,
    bottom: width / 2,
    left: 10,
    right: width - 60,
  })[position]

  calculateIndicatorY = (position, height) => ({
    top: 10,
    bottom: height - 40,
    left: height / 2,
    right: height / 2 - 40,
  })[position]

  ticked = () => {
    const { width, height } = this.svgRef.current.getBoundingClientRect();
    /**
     * Nodes tick
     */
    this.nodeElements
    .attr('x', d => d.x)
    .attr('y', d => d.y);
    this.nodeElements.selectAll(`path.${this.props.classNamePrefix}__node-border`)
    .attr('class', ({ id }) => `${this.props.classNamePrefix}__node-border${this.selectedNode.id === id ? ' selected' : ''}`);
    /**
     * Node labels tick
     */
    this.textElements
    .attr('x', node => node.x - node.width / 2 + NODE_SIZE)
    .attr('y', node => node.y + NODE_SIZE + 8 + NODE_SIZE);
    this.textElements.selectAll(`text.${this.props.classNamePrefix}__label-text`)
    .attr('class', ({ id }) => `${this.props.classNamePrefix}__label-text${this.selectedNode.id === id ? ' selected' : ''}`);
    this.textElements.selectAll(`rect.${this.props.classNamePrefix}__label-background`)
    .attr('class', ({ id }) => `${this.props.classNamePrefix}__label-background${this.selectedNode.id === id ? ' selected' : ''}`);
    /**
     * Node levels tick
     */
    this.levelGroup
    .attr('opacity', 1)
    .attr('stroke', nodes => levelColors[Math.min(...nodes.map(({ level }) => level))])
    .attr('fill', nodes => levelColors[Math.min(...nodes.map(({ level }) => level))])
    .attr('d', nodes => {
      let data = nodes;
      if (nodes.length < 3) {
        data = [ ...nodes, ...nodes.map(({ x, y }) => ({ x: x + NODE_SIZE / 2, y: y + NODE_SIZE / 2 })) ];
      }

      const polygon = this.polygonGenerator(data);
      const hull = d3.polygonHull(polygon);
      return this.valueLine(hull.map(([ x, y ]) => {
        return [ x, y ];
      }));
    })
    .attr('y', nodes => Math.min(...nodes.map(({ y }) => y)) - NODE_SIZE * 2)
    .attr('x', nodes => Math.min(...nodes.map(({ x }) => x)) - NODE_SIZE * 2);

    /**
     * Overflow indicators
     */
    this.overflowIndicatorsElements
    .attr('display', (data) => this.calculateOverflow(data.position, data.nodes, height, width) === 0 ? 'none' : 'initial')
    .attr('x', ({ position }) => this.calculateIndicatorX(position, width) - 10)
    .attr('y', ({ position }) => (this.calculateIndicatorY(position, height)) - 10);
    this.overflowIndicatorsElements.selectAll('text')
    .text((data) => this.calculateOverflow(data.position, data.nodes, height, width))
    .attr('display', (data) => this.calculateOverflow(data.position, data.nodes, height, width) === 0 ? 'none' : 'initial');

    /**
     * Link tick
     */
    this.linkElements
    .attr('x1', ({ source: { x }}) => x + NODE_SIZE)
    .attr('y1', ({ source: { y }}) => y + NODE_SIZE)
    .attr('x2', ({ target: { x }}) => x + NODE_SIZE)
    .attr('y2', ({ target: { y }}) => y + NODE_SIZE)
    .attr('class', ({ type, status, animated }) => type === 'invisible'
      ? '' : `topology-viewer__edge ${ type || 'solid'} ${status || ''} ${animated ? 'animated' : ''}`)
    .attr('marker-end', ({ directional, status }) => directional ? `url(#${this.props.arrowMarkerId}-${status || 'normal'})` : '')
    .attr('stroke', ({ type }) => {
      return type === 'invisible' ? 'transparent' : 'inherit';
    });

    /**
     * Link label tick
     */
    this.linkLabelsElements
    .attr('x', ({ source, target }) => (source.x + target.x) / 2)
    .attr('y', ({ source, target }) => (source.y + target.y) / 2 + NODE_SIZE / 2);
  }

  render() {
    return (
      <div id="svg-container" className={this.props.className}>
        <svg className={this.props.className} ref={this.svgRef} id="svg">
          <defs>
            <marker
              id={`${this.props.arrowMarkerId}-normal`}
              className={`${this.props.classNamePrefix}__line-arrow-normal`}
              markerWidth={NODE_SIZE}
              markerHeight={NODE_SIZE}
              refX={NODE_SIZE + 1}
              refY="3"
              orient="auto"
              viewBox="0 0 20 20"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L6,3 z"/>
            </marker>
            <marker
              id={`${this.props.arrowMarkerId}-success`}
              className={`${this.props.classNamePrefix}__line-arrow-success`}
              markerWidth={NODE_SIZE}
              markerHeight={NODE_SIZE + 1}
              refX={NODE_SIZE}
              refY="3"
              orient="auto"
              viewBox="0 0 20 20"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L6,3 z"/>
            </marker>
            <marker
              id={`${this.props.arrowMarkerId}-warning`}
              className={`${this.props.classNamePrefix}__line-arrow-warning`}
              markerWidth={NODE_SIZE}
              markerHeight={NODE_SIZE + 1}
              refX={NODE_SIZE}
              refY="3"
              orient="auto"
              viewBox="0 0 20 20"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L6,3 z"/>
            </marker>
            <marker
              id={`${this.props.arrowMarkerId}-danger`}
              className={`${this.props.classNamePrefix}__line-arrow-danger`}
              markerWidth={NODE_SIZE}
              markerHeight={NODE_SIZE}
              refX={NODE_SIZE}
              refY="3"
              orient="auto"
              viewBox="0 0 20 20"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L6,3 z"/>
            </marker>
            <filter id="dropshadow" height="130%" width="130%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1"/>
              <feOffset dx="2" dy="2" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.5"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
        </svg>
      </div>
    );
  }
}

TopologyCanvas.propTypes = {
  nodes: PropTypes.arrayOf(PropTypes.object).isRequired,
  edges: PropTypes.arrayOf(PropTypes.object).isRequired,
  isFiltering: PropTypes.bool,
  handleNodeClick: PropTypes.func.isRequired,
  healthState: PropTypes.bool,
  resetSelected: PropTypes.bool,
  classNamePrefix: PropTypes.string,
  className: PropTypes.string,
  textIndicatorAttrs: PropTypes.shape({
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    rx: PropTypes.number.isRequired,
  }),
  iconMapper: PropTypes.object,
  arrowMarkerId: PropTypes.string,
};

TopologyCanvas.defaultProps = {
  isFiltering: false,
  healthState: false,
  resetSelected: false,
  className: 'topology-viewer',
  classNamePrefix: 'topology-viewer',
  textIndicatorAttrs: {
    width: 50,
    height: 30,
    rx: 15,
  },
  arrowMarkerId: 'line-arrow-marker',
};

export default TopologyCanvas;
