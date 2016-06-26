import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { invertBy, reduce, partial, find, isEmpty } from 'lodash';

import cities from '../constants/cities';
import PlayersLayer from '../containers/PlayersLayer';
import LocationsLayer from '../components/map/LocationsLayer';
import PathsLayer from '../components/map/PathsLayer';
import * as mapActions from '../actions/mapActions';
import { isDriveAvailable } from '../selectors';


class Map extends React.Component {
  constructor(props) {
    super(props);
  }

  transitionPlayerMove(playerId, destinationId) {
    this.refs.players.transitionPlayerMove(playerId, this.props.map.locations[destinationId].coords);
  }

  calculatePaths() {
    const paths = [];
    const { matrix, locations } = this.props.map;
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < i; j++) {
        if (matrix[i][j] === 1) {
          const begin = locations[i].coords;
          const end = locations[j].coords;
          paths.push([begin, end]);
        }
      }
    }

    return paths;
  }

  calculatePlayersPositions() {
    const playersByCity = invertBy(this.props.map.playersLocations);
    return reduce(playersByCity, (acc, players, cityId) => {
      const playersToIterate = [...players];
      const currentPlayerIndex = players.indexOf(this.props.currentPlayerId);
      if (currentPlayerIndex >= 0) {
        playersToIterate.splice(currentPlayerIndex, 1);
        playersToIterate.unshift(this.props.currentPlayerId);
      }
      const cityCoords = this.props.map.locations[cityId].coords;
      const playerCoords = playersToIterate.map((id, i) => ({ id, coords: [cityCoords[0], cityCoords[1] + i * 4]}));
      playerCoords.reverse();
      return acc.concat(playerCoords);
    }, []);
  }

  render() {
    const { map, availableCities, players, currentPlayerId, isDriveAvailable } = this.props;
    const { govGrantCities } = this.props.currentMove;

    const playersPositions = this.calculatePlayersPositions();
    const paths = this.calculatePaths();
    const citiesToSelect = find([availableCities, govGrantCities], (c) => !isEmpty(c));

    return (
      <div className="map">
        <PathsLayer paths={paths} />
        <LocationsLayer locations={map.locations} cities={cities} availableCities={citiesToSelect}
          onCityClicked={this.props.onCityClicked} onCityDoubleClicked={this.props.onCityDoubleClicked}
          isDriveAvailable={isDriveAvailable} />
        <PlayersLayer ref="players" players={players} playersPositions={playersPositions}
          currentPlayerId={currentPlayerId} />
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return { map: state.map, players: state.players, currentMove: state.currentMove,
    availableCities: state.currentMove.availableCities, currentPlayerId: state.currentMove.player,
    isDriveAvailable: partial(isDriveAvailable, state) };
};

const mapDispatchToProps = (dispatch) => {
  return {
    actions: bindActionCreators(Object.assign({}, mapActions), dispatch)
  };
};


export default connect(mapStateToProps, mapDispatchToProps, null, { withRef: true })(Map);
