const Spinner = ({ size = 'md', center = false }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const spinner = (
    <div
      className={`${sizes[size]} animate-spin rounded-full border-4
                  border-gray-200`}
      style={{ borderTopColor: '#3c1a5b' }}
    />
  );

  if (center) {
    return (
      <div className="flex items-center justify-center w-full py-20">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default Spinner;