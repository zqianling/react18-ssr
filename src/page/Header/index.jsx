import React from "react";

export default function Header() {
  function handleGoOut() {
    console.log("执行事件");
  }
  return (
    <div>
      头部组件
      <button onClick={handleGoOut}>点击</button>
    </div>
  );
}
