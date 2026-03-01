#!/usr/bin/env python3
"""
Asset Client - Collects device information and sends it to the OpenAsset server
Uses neofetch for system information, dpkg for system packages, and pip for Python packages
"""

import json
import subprocess
import socket
import re
import sys
import requests
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, asdict
from pathlib import Path


@dataclass
class Package:
    """Represents a package with type and version"""
    type: str
    package: str
    version: str


@dataclass
class ScanData:
    """Represents the device scan data"""
    hostname: str
    host: str
    os: str
    kernel: str
    ram: str
    cpu: str
    type: str
    status: str
    uptime: str
    packages: List[Dict]


class AssetCollector:
    """Collects device information from various sources"""
    
    def __init__(self):
        self.packages: List[Package] = []
    
    def get_hostname(self) -> str:
        """Get device hostname"""
        try:
            return socket.gethostname()
        except Exception as e:
            print(f"Warning: Could not get hostname: {e}")
            return "unknown"
    
    def parse_neofetch(self) -> Dict[str, str]:
        """Parse neofetch output to extract system information"""
        info = {
            'host': 'unknown',
            'os': 'unknown',
            'kernel': 'unknown',
            'cpu': 'unknown',
            'ram': 'unknown',
            'uptime': 'unknown'
        }
        
        try:
            # Run neofetch with machine-readable output
            result = subprocess.run(
                ['neofetch', '--off'],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            output = result.stdout
            
            # Parse key information from neofetch output
            lines = output.split('\n')
            
            for line in lines:
                if 'Host:' in line:
                    info['host'] = line.split('Host:')[1].strip()
                elif 'OS:' in line:
                    info['os'] = line.split('OS:')[1].strip()
                elif 'Kernel:' in line:
                    info['kernel'] = line.split('Kernel:')[1].strip()
                elif 'CPU:' in line:
                    info['cpu'] = line.split('CPU:')[1].strip()
                elif 'Memory:' in line:
                    info['ram'] = line.split('Memory:')[1].strip()
                elif 'Uptime:' in line:
                    info['uptime'] = line.split('Uptime:')[1].strip()
            
        except FileNotFoundError:
            print("Warning: neofetch not found. Please install neofetch: sudo apt install neofetch")
        except subprocess.TimeoutExpired:
            print("Warning: neofetch timed out")
        except Exception as e:
            print(f"Warning: Error running neofetch: {e}")
        
        return info
    
    def get_dpkg_packages(self) -> List[Package]:
        """Get list of installed dpkg packages"""
        packages = []
        
        try:
            result = subprocess.run(
                ['dpkg', '-l'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            lines = result.stdout.split('\n')
            
            for line in lines:
                # dpkg -l format: ii  package-name    version    architecture    description
                parts = line.split()
                if len(parts) >= 3 and parts[0] == 'ii':
                    package_name = parts[1]
                    version = parts[2]
                    
                    packages.append(Package(
                        type='dpkg',
                        package=package_name,
                        version=version
                    ))
        except FileNotFoundError:
            print("Warning: dpkg not found. This is a Debian/Ubuntu system requirement.")
        except subprocess.TimeoutExpired:
            print("Warning: dpkg list timed out")
        except Exception as e:
            print(f"Warning: Error getting dpkg packages: {e}")
        
        return packages
    
    def get_pip_packages(self) -> List[Package]:
        """Get list of installed pip packages"""
        packages = []
        
        try:
            result = subprocess.run(
                ['pip', 'list', '--format=json'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                pip_packages = json.loads(result.stdout)
                
                for pkg in pip_packages:
                    packages.append(Package(
                        type='pip',
                        package=pkg['name'],
                        version=pkg['version']
                    ))
        except FileNotFoundError:
            print("Warning: pip not found. Please install pip: sudo apt install python3-pip")
        except json.JSONDecodeError:
            print("Warning: Could not parse pip output")
        except subprocess.TimeoutExpired:
            print("Warning: pip list timed out")
        except Exception as e:
            print(f"Warning: Error getting pip packages: {e}")
        
        return packages
    
    def get_device_status(self) -> str:
        """Determine device status (online/offline)"""
        return "online"
    
    def collect_all_packages(self):
        """Collect all packages from various package managers"""
        print("Collecting packages...")
        
        print("  - Getting dpkg packages...")
        dpkg_packages = self.get_dpkg_packages()
        print(f"    Found {len(dpkg_packages)} dpkg packages")
        
        print("  - Getting pip packages...")
        pip_packages = self.get_pip_packages()
        print(f"    Found {len(pip_packages)} pip packages")
        
        self.packages = dpkg_packages + pip_packages
        print(f"Total packages collected: {len(self.packages)}")
    
    def get_scan_data(self) -> ScanData:
        """Collect all device information and return scan data"""
        print("Collecting device information...")
        
        hostname = self.get_hostname()
        print(f"  - Hostname: {hostname}")
        
        print("  - Running neofetch...")
        neofetch_info = self.parse_neofetch()
        
        self.collect_all_packages()
        
        # Convert packages to dictionaries
        packages_list = [asdict(pkg) for pkg in self.packages]
        
        scan_data = ScanData(
            hostname=hostname,
            host=neofetch_info.get('host', 'unknown'),
            os=neofetch_info.get('os', 'unknown'),
            kernel=neofetch_info.get('kernel', 'unknown'),
            ram=neofetch_info.get('ram', 'unknown'),
            cpu=neofetch_info.get('cpu', 'unknown'),
            type='linux',
            status=self.get_device_status(),
            uptime=neofetch_info.get('uptime', 'unknown'),
            packages=packages_list
        )
        
        return scan_data


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
            
            response = requests.post(
                self.scan_endpoint,
                json=payload,
                timeout=self.timeout,
                headers={'Content-Type': 'application/json'}
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
        default='http://localhost:3000',
        help='OpenAsset server URL (default: http://localhost:3000)'
    )
    parser.add_argument(
        '--timeout',
        type=int,
        default=30,
        help='Request timeout in seconds (default: 30)'
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
        scan_data = collector.get_scan_data()
        
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
