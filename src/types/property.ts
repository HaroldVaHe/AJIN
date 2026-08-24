export type PropertyOperation = 'venta' | 'arriendo';
export type PropertyType = 'apartamento' | 'casa' | 'oficina' | 'lote' | 'bodega';
export type PropertyStatus = 'pending' | 'approved' | 'rejected';

export interface Property {
  id: number;
  operation: PropertyOperation;
  type: PropertyType;
  title: string;
  description: string;
  price_cop: number;
  area_m2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  stratum: number | null;
  neighborhood: string;
  city: string;
  department: string;
  status: PropertyStatus;
  featured: boolean;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  source: 'admin' | 'client';
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface PropertyImage {
  id: number;
  property_id: number;
  url: string;
  path: string;
  position: number;
}

export interface PropertyWithImages extends Property {
  images: PropertyImage[];
}

/** Versión pública: nunca expone datos de contacto del propietario. */
export type PublicProperty = Omit<
  Property,
  'owner_name' | 'owner_phone' | 'owner_email'
> & {
  images: PropertyImage[];
};
