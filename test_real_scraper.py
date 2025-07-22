#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from server.roster_scraper import OBARosterScraper

def test_real_team_scraping():
    """Test scraping with real OBA team URL"""
    scraper = OBARosterScraper()
    
    # Test Essex Yellow Jackets - real team ID 500348
    print("Testing real OBA team scraping...")
    print("=" * 50)
    
    # Test the probe_team_id method with real team
    team_id = "500348"  # Essex Yellow Jackets
    print(f"Probing team ID: {team_id}")
    
    result = scraper.probe_team_id(team_id)
    if result:
        print(f"✅ Found team: {result}")
        
        # Generate the actual OBA URL
        oba_url = f"https://www.playoba.ca/stats#/2111/team/{team_id}/roster"
        print(f"🔗 Real OBA URL: {oba_url}")
        
        # Test roster scraping for this team
        print("\nTesting roster extraction...")
        roster_data = scraper.scrape_roster(oba_url)
        if roster_data:
            print(f"✅ Roster found: {len(roster_data.get('players', []))} players")
            print(f"Team Name: {roster_data.get('team_name', 'Unknown')}")
            if roster_data.get('players'):
                print("Sample players:")
                for i, player in enumerate(roster_data['players'][:3]):
                    print(f"  {i+1}. {player}")
        else:
            print("❌ No roster data extracted")
    else:
        print("❌ Team not found")
    
    print("\n" + "=" * 50)
    
    # Test another real team
    team_id_2 = "500717"  # LaSalle Turtle Club
    print(f"Probing team ID: {team_id_2}")
    
    result_2 = scraper.probe_team_id(team_id_2)
    if result_2:
        print(f"✅ Found team: {result_2}")
        oba_url_2 = f"https://www.playoba.ca/stats#/2111/team/{team_id_2}/roster"
        print(f"🔗 Real OBA URL: {oba_url_2}")
    else:
        print("❌ Team not found")

if __name__ == "__main__":
    test_real_team_scraping()