import React, { useState, FormEvent, ChangeEvent } from 'react';
import {Form, FormControl, Button } from 'react-bootstrap';

// Definujte typ pre props
type SearchComponentProps = {
    onSearch: (query: string) => void;
};

const SearchComponent: React.FC<SearchComponentProps> = ({ onSearch }) => {
    const [query, setQuery] = useState<string>(''); // <string> definuje typ štátu

    // Pridajte typ eventu pre handleSubmit
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSearch(query);
    };

    // Pridajte typ eventu pre onChange
    return (
        <Form className="search-panel d-flex justify-content-center" onSubmit={handleSubmit}>
            <FormControl 
                type="text"
                value={query}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                placeholder="Search for article by keywords, author, title, public tags..."
                className="mr-sm-2 my-auto" // Pridaná trieda my-auto
                />
            <Button variant="outline-success" type="submit" className="my-auto">
                Search
            </Button>
        </Form>
    );
};

export default SearchComponent;
