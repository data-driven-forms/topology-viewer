import React, { Component, createRef } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';

import './style.scss';

function getNodeColor() {
  return 'green';
}

const NODE_SIZE = 25;

class TopologyCanvas extends Component {
  constructor(props) {
    super(props);
    this.svgRef = createRef(null);
    this.nodes = [ ...this.props.nodes ];
    this.edges = [ ...this.props.edges ];
    this.textElements = [];
    this.nodeElements = [];
    this.linkElements = [];
    this.groupElements = [];
    this.groups = {};
    this.levelElements = [];
    this.overflowIndicators = [
      { position: 'top', nodes: []},
      { position: 'left', nodes: []},
      { position: 'bottom', nodes: []},
      { position: 'right', nodes: []},
    ];
    this.overflowIndicatorsText = [];
    this.transform = {
      x: 0,
      y: 0,
      k: 1,
    };
    this.levelGroup;
    this.minZoom = 1;
    this.maxZoom = 10;
    window.magix = this;
  }

  zoomed = () => {
    const currentTransform = d3.event.transform;
    this.transform = currentTransform;
    this.simulation.on('tick')();
    this.svg.attr('transform', currentTransform);
  }

  updateGraph = ({ nodes, edges }) => {
    const { width, height } = this.svgRef.current.getBoundingClientRect();
    const newNodes = this.props.nodes.filter(({ id }) => !nodes.find(node => id === node.id));
    const obsoleteNodes = nodes.filter(({ id }) => !this.props.nodes.find(node => node.id === id));
    // remove deleted nodes
    if (obsoleteNodes.length > 0) {
      const obsoleteEdges = edges.filter(({ id }) => !this.props.edges.find(edge => id === edge.id));
      obsoleteEdges.forEach(({ id }) => {
        this.svg.select('#edges').select(`#link-${id}`).remove();
        this.linkElements.select('#edges').select(`#link-${id}`).remove();
      });
      obsoleteNodes.forEach(({ id }) => {
        this.svg.select('#nodes').select(`#${id}`).remove();
        this.svg.select('#labels').select(`#title-${id}`).remove();
        this.nodeElements.select('#nodes').select(`#${id}`).remove();
        this.textElements.select('#labels').select(`#title-${id}`).remove();
      });
      this.edges = this.edges.filter(({ id }) => !obsoleteEdges.find(edge => edge.id === id));
      this.nodes = this.nodes.filter(({ id }) => !obsoleteNodes.find(node => node.id === id));
    }

    // add new nodes
    if (newNodes.length > 0) {
      newNodes.forEach(node => {
        this.nodes.push({ ...node,
          x: d3.event && d3.event.x / 2 || width / 1.5,
          y: d3.event && d3.event.y / 2 || height / 1.5,
        });
      });

      const newEdges = this.props.edges
      .filter(edge => !this.edges.find(({ source, target }) => source === edge.source && edge.target === target));

      if (newEdges.length > 0) {
        newEdges.forEach(edge => this.edges.push(edge));
      }
    }

    const nodeIds = this.nodes.map(({ id }) => id);
    const firstSet = nodeIds.slice(0, nodeIds.length / 2);
    const secondSet = nodeIds.slice(nodeIds.length / 2);
    let invisibleEdges = [];
    firstSet.forEach(id => {
      invisibleEdges = [ ...invisibleEdges, ...secondSet.map(node => ({ source: node, target: id, type: 'invisible' })) ];
    });
    this.edges = [ ...this.edges, ...invisibleEdges ];

    // re-render graph elements
    const linkElements = this.svg
    .select('#edges')
    .selectAll('line')
    .data(this.edges, ({ id }) => id)
    .enter()
    .append('line')
    .attr('stroke-width', 1)
    .attr('stroke', 'red')
    .attr('id', ({ id }) => `link-${id}`)
    .attr('class', ({ type = 'solid' }) => `${this.props.classNamePrefix}__edge-${type}`);

    this.linkElements = linkElements.merge(this.linkElements);

    const nodeElements = this.svg
    .select('#nodes')
    .selectAll('svg')
    .data(this.nodes, ({ id }) => id)
    .enter()
    .append('svg')
    .attr('width', NODE_SIZE * 2 + 5)
    .attr('height', NODE_SIZE * 2 + 5)
    .attr('id', node => node.id)
    .on('click', node => {
      node.fx = null;
      node.xy = null;
      return this.props.handleNodeClick(node);
    })
    .call(d3.drag().on('start', this.dragStarted).on('drag', this.dragged).on('end', this.dragEnded));

    nodeElements.append('circle')
    .attr('r', NODE_SIZE)
    .attr('cx', NODE_SIZE)
    .attr('cy', NODE_SIZE)
    .attr('fill', 'white')
    .attr('style', 'filter:url(#dropshadow)');

    nodeElements.
    append('svg')
    .attr('width', NODE_SIZE * 2 - 10)
    .attr('height', NODE_SIZE * 2 - 10)
    .attr('x', 5)
    .attr('y', 5)
    .attr('viewBox', node => this.props.iconMapper[node.nodeType]
      ? `0 -64 ${this.props.iconMapper[node.nodeType].width} ${this.props.iconMapper[node.nodeType].height}`
      : '')
    .append('path')
    .attr('fill', '#151515')
    .attr('d', node => this.props.iconMapper[node.nodeType].svgPathData);

    this.nodeElements = nodeElements.merge(this.nodeElements);

    const textElements = this.svg
    .select('#labels')
    .selectAll('svg')
    .data(this.nodes)
    .enter().append('svg')
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
    .attr('class', `${this.props.classNamePrefix}__label-cotainer`);

    textElements.append('rect')
    .attr('width', ({ width }) => width)
    .attr('class', `${this.props.classNamePrefix}__label-background`)
    .attr('style', 'filter:url(#dropshadow)');
    textElements.append('text')
    .text(node => node.title)
    .attr('x', 5)
    .attr('y', 17.5)
    .attr('class', `${this.props.classNamePrefix}__label-text`);

    this.textElements = textElements.merge(this.textElements);

    this.simulation.nodes(this.nodes).on('tick', this.ticked);

    this.svg.select('#groups').selectAll('rect').remove();
    this.svg.select('#levels').selectAll('rect').remove();
    d3.select(this.svgRef.current).select('#overflow').selectAll('svg').remove();
    this.groups = {};
    this.simulation.nodes().forEach(node => {
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

    const groupElements = this.svg
    .select('#groups')
    .selectAll('rect')
    .data(Object.values(this.groups))
    .enter()
    .append('rect')
    .attr('fill', 'blue');

    this.groupElements = groupElements;

    const allLevels = Object.values(this.groups)
    .filter(({ levels }) => levels && Object.keys(levels).length > 0)
    .map(({ levels }) => Object.values(levels)).flat();

    const levelElements = this.svg
    .select('#levels')
    .selectAll('g')
    .append('g')
    .data(allLevels)
    .enter()
    .append('rect')
    .attr('fill', 'red');
    this.levelElements = levelElements;

    this.overflowIndicators = this.overflowIndicators.map(indicator => ({ ...indicator, nodes: this.simulation.nodes() }));

    this.overflowIndicatorsElements = d3.select(this.svgRef.current)
    .select('#overflow')
    .selectAll('svg')
    .data(this.overflowIndicators)
    .enter()
    .append('svg')
    .attr('width', this.props.textIndicatorAttrs.width + 20)
    .attr('x', ({ position }) => this.calculateIndicatorX(position, width) - 10)
    .attr('y', ({ position }) => (this.calculateIndicatorY(position, height)) - 10);

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

    this.overflowIndicatorsElements
    .append('rect')
    .attr('width', () => this.props.textIndicatorAttrs.width + 20)
    .attr('height', () => this.props.textIndicatorAttrs.height + 20)
    .attr('height', ({ position }) => getBackdropHeight(position))
    .attr('width', ({ position }) => getBackdropWidth(position))
    .attr('x', ({ position }) => getBackdropX(position))
    .attr('y', ({ position }) => getBackdropY(position))
    .attr('class', `${this.props.classNamePrefix}__overflow-text-backdrop`);

    this.overflowIndicatorsElements
    .append('rect')
    .attr('width', () => this.props.textIndicatorAttrs.width)
    .attr('height', () => this.props.textIndicatorAttrs.height)
    .attr('x', 10)
    .attr('y', 10)
    .attr('class', `${this.props.classNamePrefix}__overflow-text-container`);

    this.overflowIndicatorsText = this.overflowIndicatorsElements
    .append('text')
    .attr('x', 35)
    .attr('y', 30)
    .attr('class', `${this.props.classNamePrefix}__overflow-text`);

    this.simulation.force('link').links(this.edges);
  }

  componentDidUpdate(prevProps) {
    this.updateGraph(prevProps);
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

  componentDidMount() {
    this.svg = d3.select(this.svgRef.current).append('g').attr('id', 'container').attr('transform', 'translate(0, 0) scale(1)');
    const { width, height } = this.svgRef.current.getBoundingClientRect();
    const forceX = d3.forceX(width / 2).strength(0.21);
    const forceY = d3.forceY(height / 2).strength(0.21);

    this.groupElemens = this.svg.append('g')
    .attr('id', 'groups');
    this.levelGroup = this.svg.append('g')
    .attr('id', 'levels');
    this.linkElements = this.svg.append('g')
    .attr('id', 'edges');
    this.nodeElements = this.svg.append('g')
    .attr('id', 'nodes');
    this.textElements = this.svg.append('g')
    .attr('id', 'labels');
    this.overflowIndicatorsElements = d3.select(this.svgRef.current).append('g')
    .attr('id', 'overflow');

    /**
     * create main simulation for graph
     */
    this.simulation = d3.forceSimulation()
    .force('charge', d3.forceManyBody().strength(-20).distanceMin(100).distanceMax(800))
    .force('x', forceX)
    .force('y',  forceY)
    .force('collision', d3.forceCollide().radius(() => NODE_SIZE * 4));
    this.zoom = d3.zoom().scaleExtent([ .1, 4 ])
    .on('zoom', () => {
      this.transform = d3.event.transform;
      this.simulation.on('tick')();
      this.svg.attr('transform', d3.event.transform);
    });

    d3.select(this.svgRef.current).call(this.zoom);

    this.simulation.force('link', d3.forceLink()
    .id(node => node.id)
    .distance(link => {
      if (link.source.group !== link.target.group) {
        return 500;
      }

      if (link.source.level !== link.target.level) {
        return 300;
      }

      return 180;
    })
    .strength(link => link.source.group !== link.target.group ? 1 : 0.5));

    window.addEventListener('resize', () => {
      const { width, height } = this.svgRef.current.getBoundingClientRect();
      const forceX = d3.forceX(width / 2).strength(0.21);
      const forceY = d3.forceY(height / 2).strength(0.21);
      this.simulation
      .force('x', forceX)
      .force('y',  forceY);
      this.simulation.on('tick')();
    });

    this.updateGraph(this.props);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions);
  }

  ticked = () => {
    const { width, height } = this.svgRef.current.getBoundingClientRect();
    this.nodeElements
    .attr('x', node => node.x)
    .attr('y', node => node.y);
    this.linkElements
    .attr('x1', ({ source: { x }}) => x + NODE_SIZE)
    .attr('y1', ({ source: { y }}) => y + NODE_SIZE)
    .attr('x2', ({ target: { x }}) => x + NODE_SIZE)
    .attr('y2', ({ target: { y }}) => y + NODE_SIZE)
    .attr('stroke', ({ type }) => {
      return type === 'invisible' ? 'transparent' : 'inherit';
    });
    this.textElements
    .attr('x', node => node.x - node.width / 2 + NODE_SIZE)
    .attr('y', node => node.y + NODE_SIZE + 5 + NODE_SIZE);

    this.groupElements
    .attr('fill', () => 'blue')
    .attr('opacity', 0.5)
    .attr('y', ({ nodes }) => Math.min(...nodes.map(({ y }) => y)) - NODE_SIZE * 2)
    .attr('x', ({ nodes }) => Math.min(...nodes.map(({ x }) => x)) - NODE_SIZE * 2)
    .attr('width', ({ nodes }) => Math.max(...nodes.map(({ x }) => x)) - Math.min(...nodes.map(({ x }) => x)) + (NODE_SIZE * 4))
    .attr('height', ({ nodes }) => Math.max(...nodes.map(({ y }) => y)) - Math.min(...nodes.map(({ y }) => y)) + (NODE_SIZE * 4));
    this.levelElements
    .attr('opacity', 0.25)
    .attr('y', nodes => Math.min(...nodes.map(({ y }) => y)) - NODE_SIZE * 2)
    .attr('x', nodes => Math.min(...nodes.map(({ x }) => x)) - NODE_SIZE * 2)
    .attr('width', nodes => Math.max(...nodes.map(({ x }) => x)) - Math.min(...nodes.map(({ x }) => x)) + (NODE_SIZE * 4))
    .attr('height', nodes => Math.max(...nodes.map(({ y }) => y)) - Math.min(...nodes.map(({ y }) => y)) + (NODE_SIZE * 4));
    this.overflowIndicatorsElements
    .attr('display', (data) => this.calculateOverflow(data.position, data.nodes, height, width) === 0 ? 'none' : 'initial');
    this.overflowIndicatorsText
    .text((data) => this.calculateOverflow(data.position, data.nodes, height, width))
    .attr('display', (data) => this.calculateOverflow(data.position, data.nodes, height, width) === 0 ? 'none' : 'initial');
  }

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

  render() {
    return (
      <div id="svg-container" className={this.props.className}>
        <svg className={this.props.className} ref={this.svgRef} id="svg">
          <filter id="dropshadow" height="130%">
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
};

export default TopologyCanvas;
