'use client';

import Header from 'components/core/Header';

export default function Home() {
  return (
    <div>
      <Header onMenuPressed={() => console.log('YOU GOT IT!')} />
    </div>
  );
}
