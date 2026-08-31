"use client"

import { getSearchResults } from "@/lib/serpapi"
import { FormEvent, useRef, useState } from "react"
import { SearchResult } from "@/types";
import SearchResultCard from "./SearchResultCard";

const SearchSection = () => {
    const [productName, setProductName] = useState("");
    const [filters, setFilters] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [unknownSites, setUnknownSites] = useState(Array<SearchResult>)
    const [knownSites, setKnownSites] = useState(Array<SearchResult>)
    const [listening, setListening] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            setIsLoading(true);

            // Fetch product search results
            const results = await getSearchResults(productName, filters);
            if (!results) { console.error("Couldn't find products"); return; }
            else console.log(results);
            
            // Filter out results with invalid links
            const validUnknownSites = (results.unknownSites as Array<any>)
              .filter(r => r.productLink && r.productLink !== "#")
              .slice(0, 8);
            const validKnownSites = (results.knownSites as Array<any>)
              .filter(r => r.productLink && r.productLink !== "#");
            
            console.log(`Filtered results: ${validKnownSites.length} known, ${validUnknownSites.length} unknown`);
            setUnknownSites(validUnknownSites);
            setKnownSites(validKnownSites);
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    }
    const recognitionRef = useRef<any>(null);
    const handleSpeech = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert('Your browser does not support Speech Recognition');
            return;
        }

        if (!recognitionRef.current) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.lang = 'en-US';
            recognitionRef.current.interimResults = false;
    
            recognitionRef.current.onresult = (event: any) => {
                const text = event.results[0][0].transcript;
                setProductName(text);
                setListening(false);
            };
    
            recognitionRef.current.onerror = (err: any) => {
                console.error('Speech recognition error:', err);
                setListening(false);
            };
    
            recognitionRef.current.onend = () => {
                setListening(false);
            };
        }
    
        if (listening) {
            // Stop recording
            recognitionRef.current.stop();
            setListening(false);
        } else {
            // Start recording
            recognitionRef.current.start();
            setListening(true);
        }
    };

    return (
        <section className="trending-section">
            <form className="flex flex-wrap gap-4 mt-12" onSubmit={handleSubmit}>
                {/* <input type="text" value={productName} placeholder="Enter product name" className="searchbar-input"
                    onChange={(e) => setProductName(e.target.value)} />

                <input type="text" value={filters} placeholder="Enter filters (Optional)" className="searchbar-input"
                    onChange={(e) => setFilters(e.target.value)} />

                <button type="submit" className="searchbar-btn" disabled={productName === ''}>{isLoading ? 'Searching...' : 'Search'}</button> */}

                <input
                    type="text"
                    value={productName}
                    placeholder="Enter product name"
                    className="searchbar-input"
                    onChange={(e) => setProductName(e.target.value)}
                />

                <input
                    type="text"
                    value={filters}
                    placeholder="Enter filters (Optional)"
                    className="searchbar-input"
                    onChange={(e) => setFilters(e.target.value)}
                />

                <button
                    type="button"
                    // className="px-3 py-2 searchbar-btn text-white rounded"
                    className="searchbar-btn"
                    onClick={handleSpeech}
                >
                    {listening ? '🎙️...' : '🎙️'}
                </button>
                <button
                    type="submit"
                    className="searchbar-btn"
                    disabled={productName === ''}
                >
                    {isLoading ? 'Searching...' : 'Search'}
                </button>
            </form>

            {(
                knownSites.length == 0 ? <></> : <>
                    <h2 className="section-text">Search results</h2>

                    <div className="flex flex-wrap gap-x-8 gap-y-16">
                        {knownSites?.map(result => <SearchResultCard key={result.productName} result={result} />)}
                    </div>
                </>
            )}

            {(
                unknownSites.length == 0 ? <></> : <>
                    <h2 className="section-text">Similar results</h2>
                    <div className="flex flex-wrap gap-x-8 gap-y-16">
                        {unknownSites?.map(result => <SearchResultCard key={result.productName} result={result} />)}
                    </div>
                </>
            )}
        </section>
    )
}

export default SearchSection;