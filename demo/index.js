import React from 'react';
import ReactDOM from 'react-dom';

import TopologyCanvas from '../src/';

import { nodes as n, edges as e } from '../src/data';

class TopologyWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      nodes: n,
      edges: e,
      filteredValue: '',
      addedParents: false,
      sidePanelOpen: false,
      prevFilters: [],
      addedChildren: {},
      showAll: false,
    };
  }

  handleInvokeFilter = value =>
    this.setState(prevState =>
      ({
        filteredValue: value,
        nodes: this.filterNodes(prevState.nodes, value),
      }));

  filterNodes = (nodes, value) => nodes.map((node) => {
    if (value.trim().length === 0) {
      return { ...node, highlight: false };
    }

    return node.title.toUpperCase().includes(value.toUpperCase().trim()) ? { ...node, highlight: true } : { ...node, highlight: false };
  });

  invokeAddParent = (node) => {
    const { id } = node;
    if (this.state.showAll) {
      this.setState(prevState => ({
        filteredValue: '',
        addedParents: true,
        sidePanelOpen: true,
        selectedNode: node,
        prevFilters: [ ...prevState.prevFilters, prevState.filteredValue ],
      }));
      return;
    }

    if (id === 0 && !this.state.addedParents) {
      this.setState(prevState => ({
        addedParents: true,
        filteredValue: '',
        sidePanelOpen: true,
        selectedNode: node,
        prevFilters: [ ...prevState.prevFilters, prevState.filteredValue ],
        nodes: [{
          id: 6,
          title: 'Parent 1',
          size: 24,
          fonticon: 'fa fa-cog',
          depth: 0,
        }, {
          id: 7,
          title: 'Parent 2',
          size: 24,
          fonticon: 'fa fa-cog',
          depth: 0,
        }, ...prevState.nodes ],
        edges: [ ...prevState.edges, {
          source: 6,
          target: 0,
        }, {
          source: 7,
          target: 0,
        }],
      }));
    }

    if (id === 7 && !this.state.addedChildren[id]) {
      this.setState(prevState => ({
        addedChildren: true,
        filteredValue: '',
        sidePanelOpen: true,
        selectedNode: node,
        prevFilters: [ ...prevState.prevFilters, prevState.filteredValue ],
        nodes: [
          ...prevState.nodes,
          {
            id: 8,
            title: 'Levy',
            size: 24,
            fonticon: 'fa fa-cog',
            depth: 1,
            status: 'valid',
          },
        ],
        edges: [
          ...prevState.edges,
          {
            source: 7,
            target: 8,
          },
        ],
      }));
    }

    if (id === 8 && !this.state.addedChildren[id]) {
      this.setState(prevState => ({
        addedChildren: true,
        filteredValue: '',
        sidePanelOpen: true,
        selectedNode: node,
        prevFilters: [ ...prevState.prevFilters, prevState.filteredValue ],
        nodes: [
          ...prevState.nodes,

          {
            id: 9,
            title: 'Celina',
            size: 24,
            fonticon: 'fa fa-cloud',
            depth: 2,
            status: 'valid',
          },
          {
            id: 10,
            title: 'Nancy',
            size: 24,
            fonticon: 'fa fa-cloud',
            depth: 2,
            status: 'valid',
          },
          {
            id: 11,
            title: 'Yang',
            size: 24,
            fonticon: 'fa fa-cloud',
            depth: 3,
            status: 'valid',
          },
          {
            id: 12,
            title: 'Gray',
            size: 24,
            fonticon: 'fa fa-cloud',
            depth: 3,
            status: 'critical',
          },
          {
            id: 13,
            title: 'Maddox',
            size: 24,
            fileicon: 'https://www.svgrepo.com/show/5386/speedometer.svg',
            depth: 3,
            status: 'valid',
          },
        ],
        edges: [
          ...prevState.edges,
          {
            source: 8,
            target: 9,
          },
          {
            source: 8,
            target: 10,
          },
          {
            source: 8,
            target: 11,
          },
          {
            source: 8,
            target: 12,
          },
          {
            source: 8,
            target: 13,
          },
        ],
      }));
    }

    this.setState(prevState => ({
      filteredValue: '',
      sidePanelOpen: true,
      selectedNode: node,
      prevFilters: [ ...prevState.prevFilters, prevState.filteredValue ],
    }));
  }

  handleFocusFilterInput = () => {
    if (this.state.filteredValue.trim().length === 0) {
      this.setState(prevState => ({
        filteredValue: prevState.prevFilters.pop() || '',
        prevFilters: [ ...prevState.prevFilters ],
      }));
    }
  }

  handleShowAll = () => this.setState(prevState => ({
    showAll: true,
    filteredValue: '',
    nodes: [
      ...prevState.nodes,
      {
        id: 8,
        title: 'Levy',
        size: 24,
        fonticon: 'fa fa-cog',
        depth: 1,
        status: 'valid',
      },
      {
        id: 9,
        title: 'Celina',
        size: 24,
        fonticon: 'fa fa-cloud',
        depth: 2,
        status: 'valid',
      },
      {
        id: 10,
        title: 'Nancy',
        size: 24,
        fonticon: 'fa fa-cloud',
        depth: 2,
        status: 'valid',
      },
      {
        id: 11,
        title: 'Yang',
        size: 24,
        fonticon: 'fa fa-cloud',
        depth: 3,
        status: 'valid',
      },
      {
        id: 12,
        title: 'Gray',
        size: 24,
        fonticon: 'fa fa-cloud',
        depth: 3,
        status: 'critical',
      },
      {
        id: 13,
        title: 'Maddox',
        size: 24,
        fileicon: 'https://www.svgrepo.com/show/5386/speedometer.svg',
        depth: 3,
        status: 'valid',
      }, {
        id: 6,
        title: 'Parent 1',
        size: 24,
        fonticon: 'fa fa-cog',
        depth: 0,
      }, {
        id: 7,
        title: 'Parent 2',
        size: 24,
        fonticon: 'fa fa-cog',
        depth: 0,
      },
    ],
    edges: [
      ...prevState.edges,
      {
        source: 8,
        target: 9,
      },
      {
        source: 8,
        target: 10,
      },
      {
        source: 7,
        target: 8,
      },
      {
        source: 8,
        target: 11,
      },
      {
        source: 8,
        target: 12,
      },
      {
        source: 8,
        target: 13,
      }, {
        source: 6,
        target: 0,
      }, {
        source: 7,
        target: 0,
      },
    ],
  }))

  renderSidePanel = node => (
    <div style={{ borderTop: '2px solid #39a5dc', padding: 5 }}>
      <h2 className="pf-card-title">
        {node.title}
      </h2>
      <pre>
        {JSON.stringify(node, 0, 2)}
      </pre>
    </div>
  )

  render() {
    return (
      <div>
        <div>
          <div>
            <div>
              <div style={{ marginBottom: 10 }}>
                <div xs={12}>
                  <form>
                    <div>
                      <input
                        type="text"
                        disabled={false}
                        value={this.state.filteredValue}
                        onChange={({ target: { value }}) => this.handleInvokeFilter(value)}
                        placeholder="Filter"
                        onFocus={this.handleFocusFilterInput}
                      />
                    </div>
                    <div style={{ marginLeft: 40 }}>
                      <span>Show Health State: </span>
                      <input
                        type="checkbox"
                        checked={this.state.showHealthState}
                        onChange={() => this.setState(prevState => ({ showHealthState: !prevState.showHealthState }))}
                      />
                    </div>
                    <button style={{ marginLeft: 40 }} disabled={this.state.showAll} onClick={this.handleShowAll}>Show All Nodes</button>
                  </form>
                </div>

                {
                  this.state.filteredValue.trim().length > 0 &&
                  <div style={{ marginTop: 5 }}>
                    <label type="primary" onRemoveClick={() => this.setState({ filteredValue: '' })}>
                      {this.state.filteredValue}
                    </label>
                  </div>
                }
              </div>
              <hr />
            </div>
            <div style={{ borderRight: '1px solid #f1f1f1', height: 500 }}>
              <TopologyCanvas
                nodes={this.filterNodes(this.state.nodes, this.state.filteredValue)}
                edges={this.state.edges}
                isFiltering={this.state.filteredValue.trim().length > 0}
                handleNodeClick={this.invokeAddParent}
                healthState={this.state.showHealthState}
                resetSelected={this.state.sidePanelOpen}
              />
            </div>
            <div xs={this.state.sidePanelOpen ? 3 : 0}>
              {this.state.sidePanelOpen && this.renderSidePanel(this.state.selectedNode)}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mountNode = document.getElementById('app');
ReactDOM.render(<TopologyWrapper />, mountNode);
