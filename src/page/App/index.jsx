import React, { Suspense } from "react";
import Header from "../Header";
import User from "../User";

function App() {
  return (
    <>
      <Header />
      <Suspense fallback={<div>加载中。。。</div>}>
        <User />
      </Suspense>
    </>
  );
}
export default App;
