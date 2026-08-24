export interface DepartmentGeo {
  name: string;
  cities: string[];
}

/**
 * Departamentos de Colombia con sus municipios principales.
 * La lista de ciudades es curada (capital + municipios relevantes),
 * no exhaustiva (~1.100 municipios del país).
 */
export const DEPARTMENTS: DepartmentGeo[] = [
  { name: 'Amazonas', cities: ['Leticia', 'Puerto Nariño'] },
  { name: 'Antioquia', cities: ['Medellín', 'Envigado', 'Itagüí', 'Bello', 'Rionegro', 'Sabaneta', 'La Ceja', 'Apartadó', 'Caucasia', 'Santa Fe de Antioquia', 'Guarne', 'Copacabana', 'La Estrella', 'Marinilla', 'Puerto Berrío'] },
  { name: 'Arauca', cities: ['Arauca', 'Saravena', 'Tame'] },
  { name: 'Atlántico', cities: ['Barranquilla', 'Soledad', 'Malambo', 'Puerto Colombia', 'Baranoa', 'Sabanalarga'] },
  { name: 'Bogotá D.C.', cities: ['Bogotá'] },
  { name: 'Bolívar', cities: ['Cartagena', 'Magangué', 'Turbaco', 'Arjona', 'El Carmen de Bolívar', 'Mompós'] },
  { name: 'Boyacá', cities: ['Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá', 'Paipa', 'Villa de Leyva', 'Moniquirá', 'Puerto Boyacá'] },
  { name: 'Caldas', cities: ['Manizales', 'Villamaría', 'La Dorada', 'Chinchiná', 'Riosucio', 'Palestina'] },
  { name: 'Caquetá', cities: ['Florencia', 'Belén de los Andaquíes', 'San Vicente del Caguán'] },
  { name: 'Casanare', cities: ['Yopal', 'Aguazul', 'Villanueva', 'Tauramena', 'Paz de Ariporo'] },
  { name: 'Cauca', cities: ['Popayán', 'Santander de Quilichao', 'Puerto Tejada', 'El Bordo', 'Patía (El Bordo)'] },
  { name: 'Cesar', cities: ['Valledupar', 'Aguachica', 'Bosconia', 'El Paso', 'La Jagua de Ibirico'] },
  { name: 'Chocó', cities: ['Quibdó', 'Istmina', 'Tadó', 'Condoto'] },
  { name: 'Córdoba', cities: ['Montería', 'Lorica', 'Planeta Rica', 'Sahagún', 'Cereté', 'Tierralta'] },
  { name: 'Cundinamarca', cities: ['Chía', 'Cajicá', 'Zipaquirá', 'Soacha', 'Funza', 'Mosquera', 'Madrid', 'Fusagasugá', 'Facatativá', 'Ubaté', 'Chocontá', 'La Calera', 'Sopó', 'Tenjo', 'Cota', 'Girardot', 'Anapoima', 'Villeta'] },
  { name: 'Guainía', cities: ['Inírida'] },
  { name: 'Guaviare', cities: ['San José del Guaviare', 'Calamar'] },
  { name: 'Huila', cities: ['Neiva', 'Pitalito', 'Garzón', 'La Plata', 'Campoalegre'] },
  { name: 'La Guajira', cities: ['Riohacha', 'Maicao', 'Uribia', 'Fonseca'] },
  { name: 'Magdalena', cities: ['Santa Marta', 'Ciénaga', 'Fundación', 'Aracataca', 'El Banco'] },
  { name: 'Meta', cities: ['Villavicencio', 'Acacías', 'Granada', 'Puerto López', 'Restrepo', 'Cumaral'] },
  { name: 'Nariño', cities: ['Pasto', 'Ipiales', 'Túquerres', 'La Unión', 'Barbacoas'] },
  { name: 'Norte de Santander', cities: ['Cúcuta', 'Ocaña', 'Pamplona', 'Los Patios', 'Villa del Rosario'] },
  { name: 'Putumayo', cities: ['Mocoa', 'Puerto Asís', 'Orito', 'Valle del Guamuez', 'Villagarzón'] },
  { name: 'Quindío', cities: ['Armenia', 'Calarcá', 'La Tebaida', 'Montenegro', 'Quimbaya', 'Circasia', 'Filandia', 'Salento'] },
  { name: 'Risaralda', cities: ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal', 'La Virginia', 'Balboa', 'Marsella'] },
  { name: 'San Andrés y Providencia', cities: ['San Andrés', 'Providencia'] },
  { name: 'Santander', cities: ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja', 'Socorro', 'San Gil', 'Vélez', 'Barbosa'] },
  { name: 'Sucre', cities: ['Sincelejo', 'Corozal', 'Sampués', 'Magangué', 'Tolú'] },
  { name: 'Tolima', cities: ['Ibagué', 'Espinal', 'Honda', 'Mariquita', 'Lérida', 'Melgar', 'Chaparral'] },
  { name: 'Valle del Cauca', cities: ['Cali', 'Palmira', 'Buenaventura', 'Tuluá', 'Cartago', 'Bugalagrande', 'Jamundí', 'Yumbo', 'Sevilla', 'Caicedonia', 'Florida', 'Pradera', 'Candelaria', 'Roldanillo', 'La Unión', 'Dagua', 'Bolívar (Cartago)'] },
  { name: 'Vaupés', cities: ['Mitú'] },
  { name: 'Vichada', cities: ['Puerto Carreño', 'La Primavera'] },
];

export function getCitiesForDepartment(department: string): string[] {
  return DEPARTMENTS.find((d) => d.name === department)?.cities ?? [];
}

export interface DescriptionInput {
  operation?: string | null;
  type?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  department?: string | null;
  area_m2?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  parking?: number | null;
  stratum?: number | null;
}

function plural(n: number, singular: string, pluralWord: string): string {
  return `${n} ${n === 1 ? singular : pluralWord}`;
}

/**
 * Genera una descripción base en español a partir de los datos del
 * formulario. Devuelve cadena vacía si aún no hay datos suficientes.
 */
export function composeDescription(v: DescriptionInput): string {
  if (!v.type || !v.operation) return '';

  const parts: string[] = [];

  const opText = v.operation === 'venta' ? 'en venta' : 'en arriendo';
  const locationBits = [v.neighborhood, v.city].filter(Boolean);
  const location = locationBits.length > 0 ? ` en ${locationBits.join(', ')}` : '';
  parts.push(`${capitalize(v.type)} ${opText}${location}.`);

  const specs: string[] = [];
  if (v.area_m2) specs.push(`${v.area_m2} m²`);
  if (v.bedrooms) specs.push(plural(v.bedrooms, 'habitación', 'habitaciones'));
  if (v.bathrooms) specs.push(plural(v.bathrooms, 'baño', 'baños'));
  if (v.parking) specs.push(plural(v.parking, 'parqueadero', 'parqueaderos'));
  if (specs.length > 0) {
    parts.push(`Cuenta con ${specs.join(', ')}.`);
  }

  if (v.stratum) parts.push(`Estrato ${v.stratum}.`);

  parts.push(
    'Contacta a AJIN Asesoría Jurídica Inmobiliaria y Notarial para más información o coordinar una visita.'
  );

  return parts.join(' ');
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
