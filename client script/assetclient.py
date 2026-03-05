#!/usr/bin/env python3
"""
Asset Client - Collects device information and sends it to the OpenAsset server
Uses system commands for system information, dpkg for system packages, and pip for Python packages
"""

import json
import subprocess
import socket
import sys
import gzip
import requests
from typing import Dict, List
from dataclasses import dataclass, asdict
from pathlib import Path

from asset_collector import AssetCollector, ScanData
import config


class AssetClient:
    """Client for sending device information to the OpenAsset server"""
    
    def __init__(self, server_url: str, timeout: int = 30):
        """
        Initialize the asset client
        
        Args:
            server_url: Base URL of the OpenAsset server (e.g., http://localhost:3000)
            timeout: Request timeout in seconds
        """
        self.server_url = server_url.rstrip('/')
        self.timeout = timeout
        self.scan_endpoint = f"{self.server_url}/api/scan"
    
    def send_scan(self, scan_data: ScanData) -> bool:
        """
        Send device scan to the server
        
        Args:
            scan_data: ScanData object with device information
            
        Returns:
            True if successful, False otherwise
        """
        try:
            payload = asdict(scan_data)
            
            print(f"\nSending scan to {self.scan_endpoint}...")
            print(f"  - Hostname: {scan_data.hostname}")
            print(f"  - OS: {scan_data.os}")
            print(f"  - Packages: {len(scan_data.packages)}")
            
            # Compress payload using gzip
            json_payload = json.dumps(payload).encode('utf-8')
            compressed_payload = gzip.compress(json_payload)
            
            # Calculate compression ratio
            compression_ratio = (1 - len(compressed_payload) / len(json_payload)) * 100
            print(f"  - Compression: {len(json_payload)} → {len(compressed_payload)} bytes ({compression_ratio:.1f}% reduction)")
            
            response = requests.post(
                self.scan_endpoint,
                data=compressed_payload,
                timeout=self.timeout,
                headers={
                    'Content-Type': 'application/json',
                    'Content-Encoding': 'gzip'
                }
            )
            
            if response.status_code == 201:
                try:
                    result = response.json()
                    print(f"✓ Scan sent successfully!")
                    if 'packagesProcessed' in result:
                        print(f"  - Packages processed: {result['packagesProcessed']}")
                    if 'orphanedPackagesCleaned' in result:
                        print(f"  - Orphaned packages cleaned: {result['orphanedPackagesCleaned']}")
                    return True
                except json.JSONDecodeError:
                    print(f"✓ Scan sent successfully! (Status: {response.status_code})")
                    return True
            else:
                print(f"✗ Failed to send scan (Status: {response.status_code})")
                print(f"  Response: {response.text}")
                return False
                
        except requests.exceptions.ConnectionError:
            print(f"✗ Connection error: Could not connect to {self.server_url}")
            print("  Make sure the OpenAsset server is running")
            return False
        except requests.exceptions.Timeout:
            print(f"✗ Request timed out after {self.timeout} seconds")
            return False
        except requests.exceptions.RequestException as e:
            print(f"✗ Request error: {e}")
            return False
        except Exception as e:
            print(f"✗ Unexpected error: {e}")
            return False


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='OpenAsset Client - Collects and sends device information to OpenAsset server'
    )
    parser.add_argument(
        '--server',
        default=config.SERVER_URL,
        help=f'OpenAsset server URL (default: {config.SERVER_URL})'
    )
    parser.add_argument(
        '--timeout',
        type=int,
        default=config.REQUEST_TIMEOUT,
        help=f'Request timeout in seconds (default: {config.REQUEST_TIMEOUT})'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Collect information but do not send to server'
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("OpenAsset Client")
    print("=" * 60)
    
    try:
        # Collect device information
        collector = AssetCollector()
        scan_data = collector.get_scan_data(device_type=config.DEVICE_TYPE)
        
        print("\n" + "=" * 60)
        print("Collected Information:")
        print("=" * 60)
        print(json.dumps(asdict(scan_data), indent=2, default=str)[:500] + "...")
        
        if args.dry_run:
            print("\n[DRY RUN] Not sending to server")
            return 0
        
        # Send to server
        client = AssetClient(args.server, args.timeout)
        success = client.send_scan(scan_data)
        
        print("\n" + "=" * 60)
        if success:
            print("Status: SUCCESS")
            return 0
        else:
            print("Status: FAILED")
            return 1
            
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
        return 130
    except Exception as e:
        print(f"\n✗ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())
