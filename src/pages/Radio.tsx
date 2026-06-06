import React from 'react';

interface RadioPageProps {
  onOpenAuth: () => void;
}

export const RadioPage: React.FC<RadioPageProps> = () => {
  return <div className="radio-page" aria-hidden="true" />;
};

export default RadioPage;
