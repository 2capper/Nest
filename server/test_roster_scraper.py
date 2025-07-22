#!/usr/bin/env python3
"""
Test script for the OBA roster scraper
Usage: python server/test_roster_scraper.py
"""

from roster_scraper import OBARosterScraper
import json

def test_scraper():
    scraper = OBARosterScraper()
    
    print("=== Testing OBA Roster Scraper ===\n")
    
    # Test 1: Get teams in a division
    print("Test 1: Getting teams in Sun Parlour 11U Rep division...")
    teams = scraper.get_division_teams("Sun Parlour", "2025", "11U Rep")
    print(f"Found {len(teams)} teams:")
    for team_name, url in teams.items():
        print(f"  - {team_name}: {url}")
    print()
    
    # Test 2: Fuzzy matching
    print("Test 2: Testing fuzzy team name matching...")
    test_names = [
        "Forest Glade Falcons",
        "Belle River Whitecaps",
        "Kingsville Kings 11U",
        "Ottawa Petro",
        "Pickering Red Sox"
    ]
    
    for test_name in test_names:
        print(f"\nSearching for: '{test_name}'")
        result = scraper.find_best_team_match(teams, test_name)
        if result:
            matched_name, url, confidence = result
            print(f"  Best match: '{matched_name}' (confidence: {confidence:.1f}%)")
        else:
            print("  No match found")
    
    # Test 3: Full workflow simulation
    print("\n\nTest 3: Full workflow simulation...")
    search_result = scraper.get_roster_with_fuzzy_match(
        affiliate="Sun Parlour",
        season="2025", 
        division="15U Rep",
        team_name="Tecumseh Eagles 15U"
    )
    print("Search result:")
    print(json.dumps(search_result, indent=2))
    
    # Test 4: If we have a match, try to scrape the roster
    if search_result.get('success') and search_result.get('team_url'):
        print("\n\nTest 4: Attempting to scrape actual roster...")
        import_result = scraper.confirm_and_get_roster(search_result['team_url'])
        print("Import result:")
        print(json.dumps(import_result, indent=2))

if __name__ == "__main__":
    test_scraper()