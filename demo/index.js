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
      add: true,
    };
  }

  invokeAddParent = (node) => {
    console.log('node: ', node, this.state.add)
    if(this.state.add && node.id === 0) {
      this.setState(prevState => ({
        add: !prevState.add,
        nodes: [...prevState.nodes, { id: 'child', title: 'Child to be removed' }, { id: 'child-2', title: 'Child 2 to be removed' }],
        edges: [...prevState.edges, { source: 0, target: 'child', id: '0-child' }, { source: 0, target: 'child-2', id: '0-child-2' }]
      }))
    } else if (!this.state.add && node.id === 0) {
      this.setState(prevState => ({
        add: !prevState.add,
        nodes: [...n],
        edges: [...e]
      }))
    }
  }

  render() {
    return (
      <div>
        <div style={{ borderRight: '1px solid #f1f1f1', height: 500 }}>
          <TopologyCanvas
            nodes={this.state.nodes}
            edges={this.state.edges}
            handleNodeClick={this.invokeAddParent}
          />
        </div>
        <div xs={this.state.sidePanelOpen ? 3 : 0}>
          {this.state.sidePanelOpen && this.renderSidePanel(this.state.selectedNode)}
        </div>
      </div>
    );
  }
}

const mountNode = document.getElementById('app');
ReactDOM.render(<TopologyWrapper />, mountNode);
