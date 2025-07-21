import React from 'react';

export default function GalleryTest() {
  const handleClick = () => {
    console.log('🚨 TEST BUTTON CLICKED - THIS WORKS!');
    alert('Test button clicked successfully!');
  };

  return (
    <section className="py-20 bg-[#F2EBDC]">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-[#011526] mb-8">Gallery Test</h2>
          <button 
            onClick={handleClick}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg text-xl font-bold cursor-pointer"
            style={{ pointerEvents: 'auto' }}
          >
            CLICK ME - TEST BUTTON
          </button>
          <p className="mt-4 text-gray-600">
            If this button works, the issue is in the gallery component code.
            If this button doesn't work, there's a broader JavaScript issue.
          </p>
        </div>
      </div>
    </section>
  );
}