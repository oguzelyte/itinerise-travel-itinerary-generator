// Trip itinerary interface.

// Transport types.
enum TransportTypes {
  PLANE = "Plane",
  WALK = "Walk",
  TRAIN = "Train",
  BUS = "Bus",
}

// Main trip interface.
export interface Trip {
  ID: string;
  title: string;
  userID?: string;
  interests: string[];
  startCity: {
    name: string;
    lat: number;
    lng: number;
  };
  duration?: number;
  endCity: {
    name: string;
    lat: number;
    lng: number;
  };
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  destination: {
    name: string;
    isCity: Boolean;
    lat: number;
    lng: number;
  };
  img?: string;
  allowance: string;
  travellerType: string;
  diet: string;
  pace: string;
  preferredActivities: string;

  preferredTransport: string;
  travellerCount: number;
  destCities?: string[];
  route?: Route;
}

// Route interface for superficial trip information.
interface Route {
  transport?: {
    start?: boolean;
    type: any;
    departureDate?: string;
    arrivalDate?: string;
    startTime: string;
    endTime: string;
    price?: number;
    currency?: string;
    duration: any;
    operators?: any;
  }[];
  location: {
    transport?: {
      type: any;
      startTime: string;
      endTime: string;
      duration: any;
    }[];
    info: any;
    lengthOfStay?: any;
    days?: Day[];
  }[];
}

// Day interface for day by day trip interface.
interface Day {
  day: number;
  startTrip?: any;
  endTrip?: any;
  startTransport?: {
    type: any;
    startTime: string;
    endTime: string;
    price: number;
    currency: string;
    duration: any;
    operators: any;
  }[];
  endTransport?: {
    type: string;
    startTime: string;
    endTime: string;
    price: number;
    currency: string;
    duration: number;
    operators: any;
  }[];
  date?: string;
  transport?:
    {
      type: string;
      duration: number;
    }[];
  activity?:
    {
      title: string;
      startTime?: string;
      endTime?: string;
      duration?: string;
      tags?: string[];
      img?: string;
      price?: string;
      reviews?: string;
      rating?: number;
      location?: any;
      specialTag?: string;
      description?: string;
    }[]
  ;
}
