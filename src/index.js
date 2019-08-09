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
    this.nodes = this.props.nodes;
    this.edges = this.props.edges;
  }

  componentDidUpdate(prevProps) {
    const newNodes = this.props.nodes.filter(({ id }) => !prevProps.nodes.find(node => id === node.id));
    const { width, height } = this.svgRef.current.getBoundingClientRect();
    console.log(newNodes);
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
        const linkElements = this.svg
        .select('#edges')
        .selectAll('line')
        .data(this.edges)
        .enter().append('line')
        .attr('stroke-width', 1)
        .attr('stroke', 'red');
        this.linkElements = linkElements.merge(this.linkElements);
      }

      this.simulation.nodes(this.nodes).on('tick', this.ticked);

      const nodeElements = this.svg
      .select('#nodes')
      .selectAll('circle')
      .data(this.nodes)
      .enter().append('circle')
      .attr('r', NODE_SIZE)
      .attr('fill', getNodeColor)
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
      .attr('dx',  - (NODE_SIZE / 2))
      .attr('dy', NODE_SIZE + 15);

      this.textElements = textElements.merge(this.textElements);

    }

  }

  componentDidMount() {
    this.svg = d3.select(this.svgRef.current);
    const { width, height } = this.svgRef.current.getBoundingClientRect();
    this.width = width;
    this.height = height;
    this.transform = d3.zoomIdentity;
    const forceX = d3.forceX(width / 2).strength(0.21);
    const forceY = d3.forceY(height / 2).strength(0.21);

    this.simulation = d3.forceSimulation()
    .force('charge', d3.forceManyBody().strength(-25).distanceMin(100).distanceMax(400))
    .force('x', forceX)
    .force('y',  forceY)
    .force('collision', d3.forceCollide().radius(() => NODE_SIZE * 2));

    this.dragDrop = d3.drag()
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

    this.simulation.force('link', d3.forceLink()
    .id(link => link.id)
    .distance(() => 150)
    .strength(() => 0.5));

    this.linkElements = this.svg.append('g')
    .attr('id', 'edges')
    .selectAll('line')
    .data(this.edges)
    .enter().append('line')
    .attr('stroke-width', 1)
    .attr('stroke', 'red');

    this.nodeElements = this.svg.append('g')
    .attr('id', 'nodes')
    .selectAll('circle')
    .data(this.nodes)
    .enter().append('circle')
    .attr('r', NODE_SIZE)
    .attr('fill', getNodeColor)
    .on('click', this.props.handleNodeClick)
    .call(this.dragDrop);

    this.textElements = this.svg.append('g')
    .attr('id', 'labels')
    .selectAll('text')
    .data(this.nodes)
    .enter().append('text')
    .text(node => node.title)
    .attr('font-size', 15)
    .attr('dx',  - (NODE_SIZE / 2))
    .attr('dy', NODE_SIZE + 15);

    this.simulation.nodes(this.nodes).on('tick', this.ticked);
    this.simulation.force('link').links(this.edges);
  }

  ticked = () => {
    const { width, height } = this.svgRef.current.getBoundingClientRect();
    this.linkElements
    .attr('x1', ({ source: { x }}) => Math.max(x + 5, Math.min(width - NODE_SIZE - 5, x)))
    .attr('y1', ({ source: { y }}) => Math.max(NODE_SIZE + 5, Math.min(height - NODE_SIZE - NODE_SIZE / 2, y)))
    .attr('x2', ({ target: { x }}) => Math.max(x + 5, Math.min(width - NODE_SIZE - 5, x)))
    .attr('y2', ({ target: { y }}) => Math.max(NODE_SIZE + 5, Math.min(height - NODE_SIZE - NODE_SIZE / 2, y)));
    this.nodeElements
    .attr('cx', node => Math.max(NODE_SIZE + 5, Math.min(width - NODE_SIZE - 5, node.x)))
    .attr('cy', node => Math.max(NODE_SIZE + 5, Math.min(height - NODE_SIZE - NODE_SIZE / 2, node.y)));
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
