"use client";
import { Link } from "react-router-dom";
import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';

import { useSiteSettings } from '@/hooks/useSiteSettings';
import FeaturedSliderStyle1 from '@/components/layouts/slider/FeaturedSliderStyle1';

export default function HeroCarousel() {
  const { settings } = useSiteSettings();
  const sliderStyle = settings?.layouts?.featured_slider_style || 'style-1';

  switch (sliderStyle) {
    case 'style-1':
    default:
      return <FeaturedSliderStyle1 />;
  }
}
