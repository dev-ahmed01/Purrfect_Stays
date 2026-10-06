import { Search } from 'lucide-react';

export function SearchPanel() {
  return (
    <form className="search-panel" action="/stays" method="get">
      <label className="search-field search-field-destination">
        <span>Destination</span>
        <input name="destination" placeholder="Goa, Coorg, Manali..." />
      </label>
      <div className="search-divider" aria-hidden="true" />
      <label className="search-field">
        <span>Check-in</span>
        <input name="checkIn" type="date" />
      </label>
      <div className="search-divider" aria-hidden="true" />
      <label className="search-field">
        <span>Check-out</span>
        <input name="checkOut" type="date" />
      </label>
      <div className="search-divider" aria-hidden="true" />
      <label className="search-field search-field-compact">
        <span>Guests</span>
        <select name="guests" defaultValue="2">
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </select>
      </label>
      <div className="search-divider" aria-hidden="true" />
      <label className="search-field search-field-compact">
        <span>Pets</span>
        <select name="pets" defaultValue="1">
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
        </select>
      </label>
      <button className="button button-primary search-button" type="submit">
        Find Stays <Search size={17} aria-hidden="true" />
      </button>
    </form>
  );
}
