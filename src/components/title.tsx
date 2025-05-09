import React from 'react';

interface TituloProps {
  name: string;
  icon?: React.ReactNode; // Prop opcional para el icono
}

const Titulo: React.FC<TituloProps> = ({ name, icon }) => {
  return (
    <div className="flex items-center mb-6 px-4 lg:px-6">
      {icon} {/* Renderiza el icono si existe */}
      <h1 className="text-3xl font-bold">{name}</h1>
    </div>
  );
};

export default Titulo;