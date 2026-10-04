import "leaflet/dist/leaflet.css";
import "./style.css";
import { flightData } from "./liveFlightData";
import { MapSetup } from "./map";


MapSetup()
flightData.startFetch()