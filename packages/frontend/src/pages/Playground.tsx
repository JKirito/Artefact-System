import React from 'react';
import { Layout } from '../components/common/Layout';

const Playground: React.FC = () => {
  return (
    <Layout>
      <div style={{ padding: '1rem' }}>
        <h2>Playground</h2>
        <p>This area can be used for testing components.</p>
      </div>
    </Layout>
  );
};

export default Playground;
