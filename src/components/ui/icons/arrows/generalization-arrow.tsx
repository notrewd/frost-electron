import { SVGProps } from "react";

const GeneralizationArrow = (props: SVGProps<SVGSVGElement>) => {
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
        <g transform="matrix(0.458868,0.422035,-0.388454,0.422357,352.258,-102.049)">
          <path
            d="M289.881,35.046L402.825,249.357L176.937,249.357L289.881,35.046Z"
            style={{
              fill: "currentColor",
              stroke: "currentColor",
              strokeWidth: "54.17px",
            }}
          />
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

export default GeneralizationArrow;
