// src/components/AvatarMini.jsx
export default function AvatarMini({
  size = 54,             // px del círculo

  color = "#ff6a00",     // color del trazo
}) {
  return (
    <div
      className="rounded-full grid place-items-center"
      style={{ width: size, height: size,  }}
    >
      <svg
        viewBox="0 0 24 19"
        style={{ width: size * 1, height: size * 1 }}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="5" r="4" />
        <path d="M4 20c0-4.5 3.5-8 8-8s8 3.5 8 8" />
      </svg>
    </div>
  );
}
