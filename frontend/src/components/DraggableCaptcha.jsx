import React, { useRef, useState, useEffect } from "react";

const DraggableCaptcha = ({ onVerify }) => {
  const sliderRef = useRef(null);
  const handleRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [verified, setVerified] = useState(false);
  const [position, setPosition] = useState(0); // px

  // Widths
  const [maxPos, setMaxPos] = useState(0);

  useEffect(() => {
    if (sliderRef.current && handleRef.current) {
      const sliderWidth = sliderRef.current.offsetWidth;
      const handleWidth = handleRef.current.offsetWidth;
      setMaxPos(sliderWidth - handleWidth);
    }
  }, []);

  const onDragStart = (e) => {
    if (verified) return;
    e.preventDefault();
    setDragging(true);
  };

  const onDragEnd = (e) => {
    if (verified) return;
    setDragging(false);
    if (position >= maxPos) {
      setPosition(maxPos);
      setVerified(true);
      if (onVerify) onVerify();
    } else {
      setPosition(0);
    }
  };

  const onDragMove = (e) => {
    if (!dragging || verified) return;

    let clientX;
    if (e.type === "touchmove") {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }

    const sliderRect = sliderRef.current.getBoundingClientRect();
    let newPos = clientX - sliderRect.left - handleRef.current.offsetWidth / 2;

    if (newPos < 0) newPos = 0;
    if (newPos > maxPos) newPos = maxPos;

    setPosition(newPos);
  };

  return (
    <div
      ref={sliderRef}
      className={`relative select-none bg-gray-300 rounded-2xl h-12 w-full max-w-md mx-auto`}
      onMouseMove={onDragMove}
      onMouseUp={onDragEnd}
      onMouseLeave={onDragEnd}
      onTouchMove={onDragMove}
      onTouchEnd={onDragEnd}
      onTouchCancel={onDragEnd}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={maxPos}
      aria-valuenow={position}
      tabIndex={0}
    >
      {/* Background fill when dragged */}
      <div
        className={`absolute left-0 top-0 bottom-0 bg-blue-600 rounded-2xl transition-colors duration-300 ${
          verified ? "bg-green-600" : "bg-blue-600"
        }`}
        style={{ width: position + handleRef.current?.offsetWidth / 2 || 0 }}
      />

      {/* Text */}
      <div className="absolute inset-0 flex items-center justify-center text-white font-semibold pointer-events-none select-none">
        {verified ? "Verified ✔️" : "Slide to verify"}
      </div>

      {/* Draggable handle */}
      <div
        ref={handleRef}
        className={`absolute top-1/2 transform -translate-y-1/2 bg-white border border-gray-400 rounded-2xl shadow-md cursor-pointer w-14 h-10 flex items-center justify-center select-none ${
          verified ? "bg-green-400 cursor-default" : "bg-white cursor-pointer"
        }`}
        style={{ left: position }}
        onMouseDown={onDragStart}
        onTouchStart={onDragStart}
      >
        {verified ? "✔️" : "⇨"}
      </div>
    </div>
  );
};

export default DraggableCaptcha;
