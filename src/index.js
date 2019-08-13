import React, { Component, createRef } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';

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
    this.levelGroup;
    window.magix = this;
  }

  dragDrop = d3.drag()
  .on('start', () => {
    if (!d3.event.active) {
      this.simulation.alphaTarget(0.1).restart();
    }

    d3.event.subject.fx = d3.event.subject.x;
    d3.event.subject.fy = d3.event.subject.y;
    d3.event.subject.dragStart = true;
  })
  .on('drag', () => {
    d3.event.subject.fx += d3.event.dx / this.transform.k;
    d3.event.subject.fy += d3.event.dy / this.transform.k;
    d3.event.subject.dragStart = false;
  })
  .on('end', () => {
    if (!d3.event.active) {
      this.simulation.alphaTarget(0);
    }

    if (d3.event.subject.dragStart) {
      d3.event.subject.fx = null;
      d3.event.subject.fy = null;
    }

    delete d3.event.subject.dragStart;
  });

  updateGraph = ({ nodes, edges }) => {
    const { width, height } = this.svgRef.current.getBoundingClientRect();
    const newNodes = this.props.nodes.filter(({ id }) => !nodes.find(node => id === node.id));
    const obsoleteNodes = nodes.filter(({ id }) => !this.props.nodes.find(node => node.id === id));
    // remove deleted nodes
    if (obsoleteNodes.length > 0) {
      const obsoleteEdges = edges.filter(({ id }) => !this.props.edges.find(edge => id === edge.id));
      console.log(obsoleteEdges);
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

    // re-render graph elements
    const linkElements = this.svg
    .select('#edges')
    .selectAll('line')
    .data(this.edges, ({ id }) => id)
    .enter()
    .append('line')
    .attr('stroke-width', 1)
    .attr('stroke', 'red')
    .attr('id', ({ id }) => `link-${id}`);

    this.linkElements = linkElements.merge(this.linkElements);

    const nodeElements = this.svg
    .select('#nodes')
    .selectAll('circle')
    .data(this.nodes, ({ id }) => id)
    .enter().append('circle')
    .attr('r', NODE_SIZE)
    .attr('fill', getNodeColor)
    .attr('id', node => node.id)
    .on('click', this.props.handleNodeClick)
    .call(this.dragDrop);

    this.nodeElements = nodeElements.merge(this.nodeElements);

    const textElements = this.svg
    .select('#labels')
    .selectAll('text')
    .data(this.nodes)
    .enter().append('text')
    .text(node => node.title)
    .attr('font-size', 15)
    .attr('id', node => `title-${node.id}`)
    .attr('dx',  - (NODE_SIZE / 2))
    .attr('dy', NODE_SIZE + 15);

    this.textElements = textElements.merge(this.textElements);

    this.simulation.nodes(this.nodes).on('tick', this.ticked);

    this.svg.select('#groups').selectAll('rect').remove();
    this.svg.select('#levels').selectAll('rect').remove();
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

    console.log(this.groups);

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

    this.simulation.force('link').links(this.edges);
  }

  componentDidUpdate(prevProps) {
    this.updateGraph(prevProps);
  }

  componentDidMount() {
    this.svg = d3.select(this.svgRef.current);
    const { width, height } = this.svgRef.current.getBoundingClientRect();
    this.transform = d3.zoomIdentity;
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

    /**
     * create main simulation for graph
     */
    this.simulation = d3.forceSimulation()
    .force('charge', d3.forceManyBody().strength(-1000).distanceMin(100).distanceMax(400))
    .force('x', forceX)
    .force('y',  forceY)
    .force('collision', d3.forceCollide().radius(() => NODE_SIZE * 2));

    this.simulation.force('link', d3.forceLink()
    .id(node => node.id)
    .distance(() => 150)
    .strength((link) => link.source.group === link.source.target ? 0.25 : 0.5));

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
    .attr('cx', node => Math.max(NODE_SIZE + 5, Math.min(width - NODE_SIZE - 5, node.x)))
    .attr('cy', node => Math.max(NODE_SIZE + 5, Math.min(height - NODE_SIZE - NODE_SIZE / 2, node.y)));
    this.linkElements
    .attr('x1', ({ source: { x }}) => Math.max(x + 5, Math.min(width - NODE_SIZE - 5, x)))
    .attr('y1', ({ source: { y }}) => Math.max(NODE_SIZE + 5, Math.min(height - NODE_SIZE - NODE_SIZE / 2, y)))
    .attr('x2', ({ target: { x }}) => Math.max(x + 5, Math.min(width - NODE_SIZE - 5, x)))
    .attr('y2', ({ target: { y }}) => Math.max(NODE_SIZE + 5, Math.min(height - NODE_SIZE - NODE_SIZE / 2, y)));
    this.textElements
    .attr('x', node => Math.max(NODE_SIZE + 5, Math.min(width - NODE_SIZE - 5, node.x)))
    .attr('y', node => Math.max(NODE_SIZE + 5, Math.min(height - NODE_SIZE - NODE_SIZE / 2, node.y)));
    this.groupElements
    .attr('fill', data => {
      return 'blue';
    })
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
  }

  render() {
    return <svg style={{ width: '100%', height: '100%' }} ref={this.svgRef} id="svg" />;

  }
}

TopologyCanvas.propTypes = {
  nodes: PropTypes.arrayOf(PropTypes.object).isRequired,
  edges: PropTypes.arrayOf(PropTypes.object).isRequired,
  isFiltering: PropTypes.bool,
  handleNodeClick: PropTypes.func.isRequired,
  healthState: PropTypes.bool,
  resetSelected: PropTypes.bool,
};

TopologyCanvas.defaultProps = {
  isFiltering: false,
  healthState: false,
  resetSelected: false,
};

export default TopologyCanvas;
