const DiamondFilled = () => {
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
          viewBox="0 0 16 10"
          id="diamond-filled"
          markerWidth="12"
          markerHeight="10"
          refX="16"
          refY="5"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 5 L 8 0 L 16 5 L 8 10 z"
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

export default DiamondFilled;
