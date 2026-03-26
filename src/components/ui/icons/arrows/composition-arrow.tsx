import { SVGProps } from "react";

const CompositionArrow = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        fillRule: "evenodd",
        clipRule: "evenodd",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeMiterlimit: 1.5,
      }}
      {...props}
    >
      <g transform="matrix(1.28376,0,0,1.28376,-162.271,12.3352)">
        <g transform="matrix(0.696398,0.0203806,-0.0203806,0.696398,147.336,4.27391)">
          <g transform="matrix(0.600859,0.552627,-0.508656,0.553049,315.31,-144.486)">
            <path
              d="M289.881,35.046L402.825,249.357L176.937,249.357L289.881,35.046Z"
              style={{
                fill: "currentColor",
                stroke: "currentColor",
                strokeWidth: "59.38px",
              }}
            />
          </g>
          <g transform="matrix(-0.600859,-0.552627,0.508656,-0.553049,410.475,451.939)">
            <path
              d="M289.881,35.046L402.825,249.357L176.937,249.357L289.881,35.046Z"
              style={{
                fill: "currentColor",
                stroke: "currentColor",
                strokeWidth: "59.38px",
              }}
            />
          </g>
        </g>
        <path
          d="M461.836,49.858L178.098,345.174"
          style={{
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "32.46px",
          }}
        />
      </g>
    </svg>
  );
};

export default CompositionArrow;
