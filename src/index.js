import React, { Component, createRef, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import _ from 'lodash';

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

    this.linkElements = this.svg.append('g')
    .attr('id', 'edges');
    this.nodeElements = this.svg.append('g')
    .attr('id', 'nodes');
    this.textElements = this.svg.append('g')
    .attr('id', 'labels');

    this.simulation = d3.forceSimulation()
    .force('charge', d3.forceManyBody().strength(-25).distanceMin(100).distanceMax(400))
    .force('x', forceX)
    .force('y',  forceY)
    .force('collision', d3.forceCollide().radius(() => NODE_SIZE * 2));

    this.simulation.force('link', d3.forceLink()
    .id(node => node.id)
    .distance(() => 150)
    .strength(() => 0.5));

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
  }

  render() {
    return (
      <React.Fragment>
        <svg style={{ width: '100%', height: '100%' }} ref={this.svgRef} id="svg" />
      </React.Fragment>
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
};

TopologyCanvas.defaultProps = {
  isFiltering: false,
  healthState: false,
  resetSelected: false,
};

export default TopologyCanvas;
