import React from 'react';
import ReactDOM from 'react-dom';

import TopologyCanvas from '../src/';
import Icons from '@patternfly/patternfly/icons/pf-icons.json';

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
    console.log('node: ', node, this.state.add);
    if (this.state.add && node.id === 0) {
      this.setState(prevState => ({
        add: !prevState.add,
        nodes: [
          ...prevState.nodes,
          { id: 'child', title: 'Child to be removed', group: 1, level: 2, nodeType: 'vm' },
          { id: 'child-2', group: 1, title: 'Child 2 to be removed', level: 2, nodeType: 'vm' },
        ],
        edges: [ ...prevState.edges, { source: 0, target: 'child', id: '0-child' }, { source: 0, target: 'child-2', id: '0-child-2' }],
      }));
    } else if (!this.state.add && node.id === 0) {
      this.setState(prevState => ({
        add: !prevState.add,
        nodes: [ ...n ],
        edges: [ ...e ],
      }));
    }
  }

  render() {
    const iconMapper = {
      vm: Icons.memory,
      source: Icons.info,
      network: Icons.network,
    };
    return (
      <div>
        <div style={{ borderRight: '1px solid #f1f1f1', height: 500 }}>
          <TopologyCanvas
            iconMapper={iconMapper}
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
