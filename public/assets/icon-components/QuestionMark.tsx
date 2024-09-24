export const QuestionMarkIcon = ({
  color,
  size,
}: {
  color?: string;
  size?: number;
}) => {
  return (
    <svg
      width={size || 16}
      height={size || 16}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 14.6666C4.3181 14.6666 1.33333 11.6818 1.33333 7.99992C1.33333 4.31802 4.3181 1.33325 8 1.33325C11.6819 1.33325 14.6667 4.31802 14.6667 7.99992C14.6667 11.6818 11.6819 14.6666 8 14.6666ZM8 13.3333C10.9455 13.3333 13.3333 10.9455 13.3333 7.99992C13.3333 5.0544 10.9455 2.66659 8 2.66659C5.05448 2.66659 2.66667 5.0544 2.66667 7.99992C2.66667 10.9455 5.05448 13.3333 8 13.3333ZM7.33333 9.99992H8.66667V11.3333H7.33333V9.99992ZM8.66667 8.90332V9.33325H7.33333V8.33325C7.33333 7.96505 7.6318 7.66659 8 7.66659C8.55227 7.66659 9 7.21885 9 6.66659C9 6.1143 8.55227 5.66659 8 5.66659C7.51487 5.66659 7.1104 6.01207 7.0192 6.47043L5.71154 6.20889C5.92425 5.13938 6.868 4.33325 8 4.33325C9.28867 4.33325 10.3333 5.37792 10.3333 6.66659C10.3333 7.72359 9.63047 8.61645 8.66667 8.90332Z"
        fill={color || '#404454'}
      />
    </svg>
  );
};
