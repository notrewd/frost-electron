const ArrowClosed = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      style={{
        fillRule: "evenodd",
        clipRule: "evenodd",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeMiterlimit: 1.5,
        strokeDasharray: "none",
        position: "absolute",
        top: 0,
        left: 0,
      }}
    >
      <defs>
        <marker
          viewBox="0 0 10 10"
          id="arrow-closed"
          markerWidth="8"
          markerHeight="8"
          refX="10"
          refY="5"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            fill="currentColor"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeWidth="1"
            strokeDasharray="none"
          />
        </marker>
      </defs>
    </svg>
  );
};

export default ArrowClosed;
