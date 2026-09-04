'use client';

import React, { useState, useEffect, useId } from 'react';
import { Input, Button, Badge } from '@platform/ui';
import {
  MapPin,
  Compass,
  ExternalLink,
  Navigation,
  Globe,
  Layers,
  Search,
  CheckCircle2,
  Maximize2,
  Crosshair,
  Building,
} from 'lucide-react';

export interface AddressData {
  street_address: string;
  subcity?: string;
  city: string;
  country: string;
  postal_code?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  google_maps_url?: string;
  formatted_address?: string;
}

interface AddressMapAttachmentProps {
  value?: AddressData;
  onChange?: (address: AddressData) => void;
  className?: string;
  readOnly?: boolean;
  defaultZoom?: number;
}

const POPULAR_PRESETS: Array<{
  name: string;
  subcity: string;
  street: string;
  landmark: string;
  lat: number;
  lng: number;
}> = [
  {
    name: 'Bole Atlas',
    subcity: 'Bole',
    street: 'Namibia St, Atlas Hotel Area',
    landmark: 'Behind Edna Mall & Atlas Hotels',
    lat: 9.0015,
    lng: 38.7842,
  },
  {
    name: 'Old Airport Diplomatic Enclave',
    subcity: 'Kirkos / Nifas Silk',
    street: 'South Africa Embassy Way',
    landmark: 'Near International Community School (ICS)',
    lat: 8.9821,
    lng: 38.7365,
  },
  {
    name: 'Kazanchis Financial District',
    subcity: 'Kirkos',
    street: 'Menelik II Avenue',
    landmark: 'Opposite UNECA & Intercontinental',
    lat: 9.0175,
    lng: 38.7668,
  },
  {
    name: 'CMC & Summit Residential',
    subcity: 'Yeka',
    street: 'CMC Michael Roundabout Way',
    landmark: 'Behind St. Michael Church',
    lat: 9.0232,
    lng: 38.8329,
  },
  {
    name: 'Sarbet & Vatican Embassy Area',
    subcity: 'Kirkos',
    street: 'Roosevelt St',
    landmark: 'Adjacent to Vatican Embassy & AU HQ',
    lat: 8.9958,
    lng: 38.7422,
  },
];

export function AddressMapAttachment({
  value,
  onChange,
  className = '',
  readOnly = false,
  defaultZoom = 15,
}: AddressMapAttachmentProps) {
  const [address, setAddress] = useState<AddressData>(
    value || {
      street_address: 'Namibia St, Bole Atlas',
      subcity: 'Bole',
      city: 'Addis Ababa',
      country: 'Ethiopia',
      landmark: 'Atlas High-End Commercial Corridor',
      latitude: 9.0015,
      longitude: 38.7842,
      formatted_address: 'Namibia St, Bole Atlas, Addis Ababa, Ethiopia',
      google_maps_url: 'https://www.google.com/maps/search/?api=1&query=9.0015,38.7842',
    }
  );

  const [mapType, setMapType] = useState<'m' | 'k'>('m'); // 'm' = standard roadmap, 'k' = satellite
  const [zoom, setZoom] = useState(defaultZoom);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (value) {
      setAddress(value);
    }
  }, [value]);

  const updateAddress = (updated: Partial<AddressData>) => {
    const merged: AddressData = {
      ...address,
      ...updated,
    };

    // Calculate formatted address
    const parts = [
      merged.street_address,
      merged.subcity ? `${merged.subcity} Subcity` : '',
      merged.city,
      merged.country,
    ].filter(Boolean);
    merged.formatted_address = parts.join(', ');

    // Calculate Google Maps URL
    if (merged.latitude && merged.longitude) {
      merged.google_maps_url = `https://www.google.com/maps/search/?api=1&query=${merged.latitude},${merged.longitude}`;
    } else {
      merged.google_maps_url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        merged.formatted_address
      )}`;
    }

    setAddress(merged);
    if (onChange) {
      onChange(merged);
    }
  };

  // Location string for embed URL
  const queryLocation =
    address.latitude && address.longitude
      ? `${address.latitude},${address.longitude}`
      : address.formatted_address || `${address.street_address}, ${address.city}, ${address.country}`;

  // Live embed URL using Google Maps standard embed engine
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    queryLocation
  )}&t=${mapType}&z=${zoom}&ie=UTF8&iwloc=&output=embed`;

  // Use HTML5 Geolocation to grab current device GPS coordinates
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(5));
        const lng = parseFloat(pos.coords.longitude.toFixed(5));
        updateAddress({
          latitude: lat,
          longitude: lng,
          landmark: 'GPS Verified Location Pin',
        });
      },
      (err) => {
        setIsLocating(false);
        alert(`Failed to retrieve GPS location: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectPreset = (preset: (typeof POPULAR_PRESETS)[0]) => {
    updateAddress({
      street_address: preset.street,
      subcity: preset.subcity,
      landmark: preset.landmark,
      latitude: preset.lat,
      longitude: preset.lng,
    });
  };

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Address Form Inputs (hidden if readOnly) */}
      {!readOnly && (
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                Street Address / Building
              </label>
              <Input
                placeholder="e.g. Namibia St, Bole Atlas"
                value={address.street_address}
                onChange={(e) => updateAddress({ street_address: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                Subcity / Neighborhood
              </label>
              <Input
                placeholder="e.g. Bole, Kirkos, Yeka"
                value={address.subcity || ''}
                onChange={(e) => updateAddress({ subcity: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">City</label>
              <Input
                placeholder="e.g. Addis Ababa"
                value={address.city}
                onChange={(e) => updateAddress({ city: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                Nearest Landmark / Cadastre Reference
              </label>
              <Input
                placeholder="e.g. Behind Edna Mall, Next to Ramada"
                value={address.landmark || ''}
                onChange={(e) => updateAddress({ landmark: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                GPS Latitude &amp; Longitude
              </label>
              <div className="flex gap-1.5">
                <Input
                  placeholder="Lat"
                  type="number"
                  step="0.0001"
                  value={address.latitude !== undefined ? address.latitude : ''}
                  onChange={(e) => updateAddress({ latitude: parseFloat(e.target.value) || undefined })}
                  className="font-mono text-xs"
                />
                <Input
                  placeholder="Lng"
                  type="number"
                  step="0.0001"
                  value={address.longitude !== undefined ? address.longitude : ''}
                  onChange={(e) => updateAddress({ longitude: parseFloat(e.target.value) || undefined })}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Quick Preset Location Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-zinc-500 flex items-center gap-1">
              <Compass className="h-3 w-3 text-zinc-400" />
              Quick Presets:
            </span>
            {POPULAR_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className="text-[10px] bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded-full font-medium transition-colors"
              >
                {p.name}
              </button>
            ))}

            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 transition-colors ml-auto"
            >
              <Crosshair className={`h-2.5 w-2.5 ${isLocating ? 'animate-spin' : ''}`} />
              {isLocating ? 'Acquiring GPS...' : 'Use Current Device GPS'}
            </button>
          </div>
        </div>
      )}

      {/* Live Google Map Container Card */}
      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-xs">
        {/* Map Header Bar */}
        <div className="p-2.5 bg-zinc-50 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-rose-100 text-rose-600 flex items-center justify-center">
              <MapPin className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="font-semibold text-zinc-800">
                {address.street_address || 'Property Location'}
              </span>
              <span className="text-zinc-400 text-[11px] ml-1">
                ({address.subcity ? `${address.subcity}, ` : ''}{address.city})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Satellite vs Roadmap Toggle */}
            <div className="inline-flex rounded-md border border-zinc-200 bg-white p-0.5 text-[10px]">
              <button
                type="button"
                onClick={() => setMapType('m')}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  mapType === 'm' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Roadmap
              </button>
              <button
                type="button"
                onClick={() => setMapType('k')}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  mapType === 'k' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Satellite
              </button>
            </div>

            {/* Direct Google Maps link */}
            {address.google_maps_url && (
              <a
                href={address.google_maps_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 bg-white border border-zinc-200 hover:border-zinc-300 px-2 py-1 rounded transition-colors shadow-2xs"
              >
                <ExternalLink className="h-3 w-3" />
                Open Full Map
              </a>
            )}
          </div>
        </div>

        {/* Live Interactive Google Map Frame */}
        <div className="relative aspect-16/8 sm:aspect-16/7 w-full bg-zinc-100 overflow-hidden">
          <iframe
            title="Live Google Map Address Attachment"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={embedUrl}
            className="w-full h-full"
          />

          {/* Map Pin Pulse Badge */}
          <div className="absolute top-2.5 left-2.5 pointer-events-none bg-white/90 backdrop-blur-xs border border-zinc-200/80 rounded-md px-2 py-1 shadow-xs flex items-center gap-1.5 text-[10px] text-zinc-700 font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span>
              GPS: {address.latitude || '9.0015'}°, {address.longitude || '38.7842'}°
            </span>
          </div>
        </div>

        {/* Map Footer Information */}
        <div className="p-2 bg-zinc-50/80 border-t border-zinc-100 flex flex-wrap items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5 truncate max-w-sm">
            <Building className="h-3 w-3 text-zinc-400 shrink-0" />
            <span className="truncate">{address.landmark || 'Commercial Cadastre District'}</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-700 font-medium text-[10px]">
            <CheckCircle2 className="h-3 w-3" />
            Live Map Attachment Synced
          </div>
        </div>
      </div>
    </div>
  );
}
