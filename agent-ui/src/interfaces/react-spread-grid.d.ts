declare module 'react-spread-grid' {
    import { FC } from 'react';
  
    interface SpreadGridProps {
      data: any[];
      className?: string;
    }
  
    const SpreadGrid: FC<SpreadGridProps>;
  
    export default SpreadGrid;
  }