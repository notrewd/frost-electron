import { SVGProps } from "react";

export default function AssociationArrow(props: SVGProps<SVGSVGElement>) {
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
        <g transform="matrix(0.361644,0.330891,-0.330891,0.361644,409.683,-83.0904)">
          <path
            d="M65.597,422.933L257.955,88.959L444.139,420.875"
            style={{ fill: "none", stroke: "currentColor", strokeWidth: "66.21px" }}
          />
        </g>
        <path
          d="M461.836,49.858L178.098,345.174"
          style={{ fill: "none", stroke: "currentColor", strokeWidth: "32.46px" }}
        />
      </g>
    </svg>
  );
}
