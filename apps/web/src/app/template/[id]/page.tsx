import React from "react";

function TemplatePage({ params }: { params: { id: string } }) {
  const { id } = params;
  return <div>TemplatePage {id}</div>;
}

export default TemplatePage;
