document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const currentDateElement = document.getElementById('current-date');
    const wordElement = document.getElementById('word');
    const ipaElement = document.getElementById('ipa');
    const definitionsElement = document.getElementById('definitions');
    const loadingElement = document.getElementById('loading');
    const wordContentElement = document.getElementById('word-content');
    const errorElement = document.getElementById('error');
    const shareButton = document.getElementById('share-btn');
    const listenButton = document.getElementById('listen-btn');
    
    // API endpoint
    const API_BASE_URL = 'https://gujarati.shivvtrivedi.com';
    
    // Display current date
    const today = new Date();
    currentDateElement.textContent = formatDate(today);
    
    // Get word of the day
    getWordOfTheDay()
        .then(displayWord)
        .catch(handleError);
    
    // Set up buttons
    shareButton.addEventListener('click', shareWord);
    listenButton.addEventListener('click', speakWord);
    
    /**
     * Fetches the word of the day based on the current date
     */
    async function getWordOfTheDay() {
        try {
            // Use the current date as a seed to consistently get the same word each day
            const dateString = formatDateForSeed(today);
            const seed = hashCode(dateString);
            
            // Get a list of words from the API
            const response = await fetch(`${API_BASE_URL}/api/v1/words?limit=100`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch words');
            }
            
            const words = await response.json();
            
            // Use the seed to select a word from the list
            // This ensures the same word is shown all day, but changes each day
            const index = Math.abs(seed % words.length);
            return words[index];
        } catch (error) {
            console.error('Error fetching word of the day:', error);
            console.log('Using fallback word...');
            return getFallbackWord();
        }
    }
    
    /**
     * Displays the word, pronunciation, and definitions on the page
     */
    function displayWord(word) {
        // Hide loading and show content
        loadingElement.style.display = 'none';
        wordContentElement.style.display = 'block';
        
        // Display the word
        wordElement.textContent = word.word;
        
        // Display pronunciation if available
        if (word.ipa) {
            ipaElement.textContent = word.ipa;
        } else if (word.ipa_alt) {
            ipaElement.textContent = word.ipa_alt;
        } else {
            ipaElement.textContent = '';
        }
        
        // Display definitions
        definitionsElement.innerHTML = '';
        word.definitions.forEach(def => {
            const definitionItem = document.createElement('div');
            definitionItem.className = 'definition-item';
            
            const pos = document.createElement('p');
            pos.className = 'pos';
            pos.textContent = def.pos;
            
            const definition = document.createElement('p');
            definition.className = 'definition-text';
            definition.textContent = def.definition;
            
            definitionItem.appendChild(pos);
            definitionItem.appendChild(definition);
            definitionsElement.appendChild(definitionItem);
        });
    }
    
    /**
     * Handles errors when fetching or displaying the word
     */
    function handleError(error) {
        console.error('Error:', error);
        loadingElement.style.display = 'none';
        errorElement.style.display = 'block';
    }
    
    /**
     * Formats the date for display (e.g., "Wednesday, April 23, 2025")
     */
    function formatDate(date) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('en-US', options);
    }
    
    /**
     * Formats the date as a string for seed generation (YYYY-MM-DD)
     */
    function formatDateForSeed(date) {
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }
    
    /**
     * Simple hash function to convert a string to a number
     */
    function hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }
    
    /**
     * Shares the current word via the Web Share API or fallback
     */
    function shareWord() {
        const wordText = wordElement.textContent;
        const shareText = `Today's Gujarati Word of the Day: ${wordText}`;
        const shareUrl = window.location.href;
        
        if (navigator.share) {
            navigator.share({
                title: 'Gujarati Word of the Day',
                text: shareText,
                url: shareUrl
            })
            .catch(error => console.error('Error sharing:', error));
        } else {
            // Fallback for browsers that don't support the Web Share API
            prompt('Copy this link to share:', `${shareText}\n${shareUrl}`);
        }
    }
    
    /**
     * Speaks the current word using the Web Speech API
     */
    function speakWord() {
        // Get the current word
        const wordText = wordElement.textContent;
        
        // Check if speech synthesis is supported
        if ('speechSynthesis' in window) {
            // Create a new speech synthesis utterance
            const utterance = new SpeechSynthesisUtterance(wordText);
            
            // Set the language to Gujarati
            utterance.lang = 'gu-IN';
            
            // Set a slower rate for better pronunciation
            utterance.rate = 0.8;
            
            // Add visual feedback when speaking
            listenButton.classList.add('speaking');
            
            // Add an event listener for when speech has finished
            utterance.onend = () => {
                listenButton.classList.remove('speaking');
            };
            
            // Speak the word
            window.speechSynthesis.speak(utterance);
        } else {
            // Speech synthesis not supported
            alert('Sorry, your browser does not support text-to-speech functionality.');
        }
    }
    
    /**
     * Fallback function to fetch a random word if the API fails
     * This ensures the page still works even if there are API issues
     */
    async function getFallbackWord() {
        // Sample fallback words
        const fallbackWords = [
            {
                word: "નમસ્તે",
                ipa: "/nəməste/",
                definitions: [
                    { pos: "interjection", definition: "Hello; Greetings (a common greeting)" }
                ]
            },
            {
                word: "આભાર",
                ipa: "/ābhār/",
                definitions: [
                    { pos: "noun", definition: "Thanks; Gratitude" }
                ]
            },
            {
                word: "પ્રેમ",
                ipa: "/prem/",
                definitions: [
                    { pos: "noun", definition: "Love; Affection" }
                ]
            }
        ];
        
        // Use the date to select a consistent fallback word
        const dateString = formatDateForSeed(today);
        const seed = hashCode(dateString);
        const index = Math.abs(seed % fallbackWords.length);
        
        return fallbackWords[index];
    }
});
