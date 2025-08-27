import { useState, useEffect } from 'react';

const useStore = <T, F>(
  store: (callback: (state: T) => F) => F,
  callback: (state: T) => F
) => {
  const result = store(callback);
  const [data, setData] = useState<F>();

  useEffect(() => {
    setData(result);
  }, [result]);

  return data;
};

export default useStore;
