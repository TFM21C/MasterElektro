import * as React from "react";

export interface AusschalterProps extends React.SVGProps<SVGSVGElement> {
  x?: number;
  y?: number;
  scale?: number;
}

const Ausschalter: React.FC<AusschalterProps> = ({ x = 0, y = 0, scale = 1, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 358 249"
    x={x}
    y={y}
    width={60 * scale}
    height={60 * scale}
    {...props}
  >
    <path
      fill="none"
      opacity="1"
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={5}
      d="M260 11.5C258 11.667 256.00006 11.978 253.999985 11.979c-62.333313.026-124.666657.018-186.999977.035-1.83825.0005-3.727436-.349263-6 .695029 0 1.456193 0 3.123534 0 4.790874C61 84.833336 60.999283 152.166672 61.001152 219.5c.000179 6.491226.007622 6.498749 6.498848 6.498886C152.833328 226.00058 238.166672 226.002289 323.5 225.985413c1.934143-.000382 3.956726.460632 5.875-1.038529 0-70.446884 0-141.196884 0-212.946884-22.865234 0-45.620117 0-68.375 0"
    />
    <path
      fill="none"
      opacity="1"
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={5}
      d="M127 3c0 29.500942 0 59.001884 0 89 1.998459 0 3.499237 0 5 0 22.666672 0 45.333328-.006676 67.999985.01207 1.910888.001579 3.802322.067276 5.5-1"
    />
    <path
      fill="none"
      opacity="1"
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={5}
      d="M208.5 93.5c.819092 5.731773 4.18985 10.423264 6.58844 15.457863 11.637436 24.426674 23.578735 48.708549 35.411163 73.042335 2.835892 5.832093 5.591003 11.705201 8.532593 17.483414 1.46405 2.87587 2.156281 5.795654 1.992615 9.017654-.287537 5.66121.452423 11.355912-.524811 17. -"
    />
    <path
      fill="none"
      opacity="1"
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={6}
      d="M133.5 170.5c-5.717102-4.70015-9.191742-11.228348-13.327888-17.120819-2.983887-4.250931-5.89209-6.057938-11.17334-6.00705-28.164055.271408-56.332104.127869-84.498772.127869"
    />
    <path
      fill="none"
      opacity="1"
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={5}
      d="M261 3c0 29 0 58 0 87"
    />
    <path
      fill="none"
      opacity="1"
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={4}
      d="M195 25.5c-4.064484 2.341444-8.731461 3.321951-10.721802 8.921158-2.107696 5.929386 1.516892 12.873787 7.241425 15.026661 5.73587 2.157142 13.134857-1.937123 14.980392-7.947815 1.699539-5.535217-1.124268-11.616631-6.499924-13.999202-1.50058-.665364-2.999092-1.333136-4.499908-2"
    />
    <path
      fill="none"
      opacity="1"
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={5}
      d="M163 150c-4.666672 0-9.987152-1.414215-13.832016.363358-4.649063 2.149383-5.919067 8.502227-9.249664 12.569763-1.887818 2.305496-2.85141 5.279831-5.401367 7.090759-1.708115 1.213074-1.089158 2.894028-.516953 4.47612"
    />
    <path
      fill="none"
      opacity="1"
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={5}
      d="M237 92c-9.327484.468338-18.691956-0.877831-28.013947.665749-1.513366.250587-2.857131-0.806122-3.535324-2.647599-2.996322-8.135742-7.154877-15.745285-10.950684-23.518002"
    />
    <path
      fill="none"
      opacity="1"
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={5}
      d="M260.5 226.5c1.057007 7.647308.250732 15.335129.5 23"
    />
    <path
      fill="none"
      opacity="1"
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={5}
      d="M23 125c0 15 0 30 0 45"
    />
    <path
      fill="none"
      opacity="1"
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={6}
      d="M195.5 12.5c0 4.166666 0 8.333334 0 12.5"
    />
    <path
      fill="none"
      opacity="1"
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={5}
      d="M195.5 149.5c-4.129791 1.088486-8.337769.222443-12.5.5"
    />
    <path
      fill="none"
      opacity="1"
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={5}
      d="M226 150c-4.162231-.277557-8.370209.588486-12.5-.5"
    />
  </svg>
);

export default Ausschalter;
